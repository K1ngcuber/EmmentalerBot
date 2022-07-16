import {
  confirmRankChange,
  degradeRanking,
  getRanking,
  increaseRanking,
  showRules,
} from "./commander.js";

const showOptions = async () => {
  return routes.map((x) => x.path).join("\n");
};

export const routes = [
  {
    path: "/start",
    method: showOptions,
  },
  {
    path: "/help",
    method: showOptions,
  },
  {
    path: "/regeln",
    method: showRules,
  },
  {
    path: "/rang",
    method: getRanking,
  },
  {
    path: "/degradieren",
    method: degradeRanking,
  },
  {
    path: "/befördern",
    method: increaseRanking,
  },
  {
    path: "/confirm",
    method: confirmRankChange,
  },
];

export const defaultResponses = [
  "Ich kann dir leider nicht helfen.",
  "Ich verstehe nicht, was du meinst.",
  "Bitte versuche es noch einmal.",
  "Gib einen gültigen Befehl ein.",
];

export const randomDefaultResponse =
  defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

export const rules = "Regeln:\n\nSo laft der Spaß";

export const confirmThreshold = 0;

//todo
export const seedRanks = [
  "König",
  "Vize",
  "Brigadier",
  "Major",
  "Leutnant",
  "Mannschaftsleutnant",
  "Mannschaftskapitän",
];
