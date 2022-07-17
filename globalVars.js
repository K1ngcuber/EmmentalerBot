import {
  confirmRankChange,
  degradeRanking,
  getRanking,
  increaseRanking,
  showRules,
} from "./commander.js";

const showOptions = async () => {
  return routes
    .filter((x) => x.visible)
    .map((x) => x.path)
    .join("\n");
};

export const routes = [
  {
    path: "/start",
    method: showOptions,
    visible: true,
  },
  {
    path: "/help",
    method: showOptions,
    visible: true,
  },
  {
    path: "/regeln",
    method: showRules,
    visible: true,
  },
  {
    path: "/rang",
    method: getRanking,
    visible: true,
  },
  {
    path: "/degradieren",
    method: degradeRanking,
    visible: true,
  },
  {
    path: "/befördern",
    method: increaseRanking,
    visible: true,
  },
  {
    path: "/confirm",
    method: confirmRankChange,
    visible: false,
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

export const confirmThreshold = 1;

//todo
export const seedRanks = [
  {
    name: "Kommandant",
    order: 0,
  },
  {
    name: "General",
    order: 1,
  },
  {
    name: "Major",
    order: 2,
  },
];
