import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import { randomDefaultResponse, routes } from "./globalVars.js";
import { confirmRankChange } from "./commander.js";

const { TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const app = express();
app.use(bodyParser.json());

const getIntention = (text) => {
  let path = "";
  try {
    path = text.replace("@emmentaler_bot", "").replace(/\s/g, "").toLowerCase();
  } catch {
    path = "upsi";
  }

  return routes.find((route) => route.path === path)?.method ?? unknownCommand;
};

const unknownCommand = async () => {
  return randomDefaultResponse;
};

const init = async () => {
  console.log("Initializing...");
  try {
    const res = await axios.get(
      `${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`
    );
  } catch (error) {
    console.error(error.response.data.description);
  }
};

app.post(URI, async (req, res) => {
  const { text, from, chat } =
    req.body?.message ?? req.body.callback_query.message;
  let result = "";

  if (req.body?.callback_query?.data) {
    result = await confirmRankChange(
      req.body.callback_query.from,
      req.body.callback_query.data
    );
  } else {
    const handler = getIntention(text);

    result = await handler(from, `${TELEGRAM_API}/sendMessage`, chat.id);
  }

  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chat.id,
      text: result,
    });
  } catch (error) {
    console.error("Something went wrong");
  }

  res.send();
});

app.listen(process.env.PORT || 8080, async () => {
  console.log("Server started");
  await init();
});
