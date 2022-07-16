import axios from "axios";
import { confirmThreshold, rules } from "./globalVars.js";
import {
  addInitialRanking,
  checkConfirmations,
  confirmRankChangeInDb,
  getRankingFromDb,
  startRankChange,
} from "./interface.js";

//returns rules for kommandieren
export const showRules = async () => {
  return rules;
};

//returns current rank of user; if no rank is found, inserts initial rank
export const getRanking = async (from) => {
  let result = "Dein aktueller Rang ist:\n";

  let ranking = await getRankingFromDb(from.id);

  if (ranking === undefined) {
    ranking = await addInitialRanking(from.id);
  }

  if (ranking.prestige !== 0) {
    result += "Prestige " + ranking.prestige + "\n" + ranking.name;
  } else {
    result += ranking.name;
  }

  return result;
};

//other users must confirm a rank change before the change is executed
export const confirmRankChange = async (from, target) => {
  const result = new Promise((resolve) => {
    confirmRankChangeInDb(from.id, target)
      .then(async () => {
        const confirmations = await checkConfirmations(target);

        if (confirmations > confirmThreshold) {
          finishRankChange(target);
          resolve(
            from.username +
              " hat den Rangwechsel bestätigt. Es sind genug Stimmen eingelangt."
          );
        }
        resolve(from.username + " hat den Rangwechsel bestätigt.");
      })
      .catch((err) => {
        resolve(err);
      });
  });

  return result;
};

//degrade rank of user by one
export const degradeRanking = async (from, api, chat_id) => {
  const result = new Promise(async (resolve) => {
    try {
      const message = await startRankChange(from.id, -1);
      await axios.post(api, {
        chat_id: chat_id,
        text:
          from.username + " hat seinen Rang verändert. Bitte bestätige das.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bestätigen",
                callback_data: from.id,
              },
            ],
          ],
        },
      });
      resolve(message);
    } catch (err) {
      resolve(err);
    }
  });

  return result;
};

//increase rank of user by one
export const increaseRanking = async (from, api, chat_id) => {
  const result = new Promise(async (resolve) => {
    try {
      const message = await startRankChange(from.id, 1);
      await axios.post(api, {
        chat_id: chat_id,
        text:
          from.username + " hat seinen Rang verändert. Bitte bestätige das.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bestätigen",
                callback_data: from.id,
              },
            ],
          ],
        },
      });
      resolve(message);
    } catch (err) {
      resolve(err);
    }
  });

  return result;
};
