import sqlite3 from "sqlite3";
import { seedRanks } from "./globalVars.js";

const db = new sqlite3.Database("db.sqlite", (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }

  console.log("Connected to the database.");
  initDb();
});

const initDb = () => {
  db.run(
    `CREATE TABLE IF NOT EXISTS rankChangeCheck (
    id INTEGER PRIMARY KEY autoincrement,
    userId INTEGER,
    change INTEGER,
    confirmerId INTEGER
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
        throw err;
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS ranking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        [order] INTEGER,
        name TEXT
    )`,
    (err) => {
      if (err) {
        console.error(err.message);
        return;
      }
      seedRanks.map((x) => {
        db.run(
          `INSERT INTO ranking ([order], name) VALUES (?,?)`,
          [x.order, x.name],
          (err) => {
            if (err) {
              console.error(err.message);
            }
          }
        );
      });
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS userRanking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid INTEGER UNIQUE,
        rankingId INTEGER,
        prestige INTEGER,

        FOREIGN KEY (rankingId) REFERENCES ranking(id)
    ) `,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );
};

export const addInitialRanking = async (userId) => {
  const result = new Promise((resolve) => {
    db.run(
      `INSERT INTO userRanking (userid, rankingId, prestige) VALUES (?, (select id from ranking order by [order] limit 1) ,?)`,
      [userId, 0],
      (err) => {
        if (err) {
          console.error(err.message);
          resolve("Es ist ein Fehler aufgetreten.");
        }
        resolve({ prestige: 0, name: seedRanks[0].name });
      }
    );
  });
  return result;
};

export const getRankingFromDb = async (userId) => {
  const select = `SELECT r.name,ur.prestige FROM userRanking ur join ranking r on ur.rankingid = r.id WHERE ur.userid = ?`;
  let rank = new Promise((resolve) => {
    db.get(select, [userId], (err, data) => {
      if (err) {
        console.error(err.message);
        resolve(-1);
      }

      return resolve(data);
    });
  });

  return rank;
};

export const confirmRankChangeInDb = async (userId, targetId) => {
  const select = `SELECT count(*) from rankChangeCheck WHERE userId = ? and confirmerId = ?`;
  const insert = `INSERT INTO rankChangeCheck (userId,confirmerId,change) VALUES (?, ?, ?)`;

  const result = new Promise(async (resolve, reject) => {
    db.get(select, [targetId, userId], (err, data) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else if (data["count(*)"] !== 0) {
        reject("Nicht doppelt abstimmen. Das macht man nicht.");
      } else {
        db.run(insert, [targetId, userId, 0], (err) => {
          if (err) {
            console.error(err.message);
            reject("Es ist ein Fehler aufgetreten.");
          }
          resolve("done");
        });
      }
    });
  });

  return result;
};

export const startRankChange = async (userId, change) => {
  const select = `SELECT count(*) from rankChangeCheck WHERE userId = ?`;
  const checkIfLast = `SELECT rankingId, (select id from ranking order by [order] limit 1) as minRankId from userranking where userId = ?;?`;
  const insert = `INSERT INTO rankChangeCheck (userId,confirmerId, change) VALUES (?, ?, ?)`;

  const result = new Promise(async (resolve, reject) => {
    //Check if new rang would be out of bounds
    db.get(checkIfLast, [userId], (err, data) => {
      if (data && data.rankingId === data.minRankId && change === -1) {
        reject("Du kannst nicht weiter runterstufen.");
      }

      //check if user has already started a change
      db.get(select, [userId], (err, data) => {
        if (err) {
          console.error(err.message);
          reject("Es ist ein Fehler aufgetreten.");
        } else if (data["count(*)"] !== 0) {
          reject("Es läuft bereits eine Rangänderung.");
        } else {
          //insert user into confirmation checks
          db.run(insert, [userId, userId, change], (err) => {
            if (err) {
              console.error(err.message);
              reject("Es ist ein Fehler aufgetreten.");
            }
            resolve(
              `${
                change < 0 ? "Degradierungsprozess" : "Beförderungsprozess"
              } wurde gestartet.`
            );
          });
        }
      });
    });
  });

  return result;
};

export const checkConfirmations = async (userId) => {
  const select = `SELECT count(*) from rankChangeCheck WHERE userId = ?`;

  const result = new Promise(async (resolve, reject) => {
    db.get(select, [userId], (err, data) => {
      if (err) {
        console.error(err.message);
        reject("Es ist ein Fehler aufgetreten.");
      }
      resolve(data["count(*)"]);
    });
  });

  return result;
};

export const finishRankChange = async (userId) => {
  const getDirection = `SELECT change FROM rankChangeCheck WHERE userId = ?`;
  const checkIfPrestige = `SELECT rankingId, (select id from ranking order by [order] desc limit 1) as maxRankId from userranking where userId = ?;?`;
  const deleteSql = "DELETE FROM rankChangeCheck WHERE userId = ?";
  const updateSql =
    "UPDATE userRanking SET rankingId = rankingId + ? WHERE userid = ?";

  const result = new Promise(async (resolve, reject) => {
    db.get(getDirection, [userId], (err, data) => {
      if (err) {
        console.error(err.message);
        reject("Es ist ein Fehler aufgetreten.");
      }

      db.run(deleteSql, [userId], (err) => {
        if (err) {
          console.error(err.message);
          reject("Es ist ein Fehler aufgetreten.");
        }

        db.run(updateSql, [data.change, userId], (err) => {
          if (err) {
            console.error(err.message);
            reject("Es ist ein Fehler aufgetreten.");
          }

          db.get(checkIfPrestige, [userId], (err, data) => {
            if (err) {
              console.error(err.message);
              reject("Es ist ein Fehler aufgetreten.");
            }
            if (data.rankingId > data.maxRankId) {
              db.run(
                `
              UPDATE userranking set prestige = prestige + 1, rankingId = (select id from ranking order by [order] limit 1) where userId = ?`,
                [userId],
                (err) => {
                  if (err) {
                    console.error(err.message);
                    reject("Es ist ein Fehler aufgetreten.");
                  }
                }
              );
            }
            resolve("Rangänderung abgeschlossen.");
          });
        });
      });
    });
  });

  return result;
};
