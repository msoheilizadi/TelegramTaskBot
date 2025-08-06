require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_TOKEN;
const botUrl = process.env.BOT_WEBHOOK_URL; // e.g. https://yourapp.up.railway.app
const port = process.env.PORT || 3000;

if (!token || !botUrl) throw new Error("Missing TELEGRAM_TOKEN or BOT_WEBHOOK_URL");

const bot = new TelegramBot(token, { webHook: { port: port, host: "0.0.0.0" } });

// Set webhook
bot.setWebHook(`${botUrl}/bot${token}`);

const app = express();
app.use(express.json());

// Route to receive updates
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Test route
app.get("/", (req, res) => {
  res.send("🤖 Bot is running!");
});

// Start Express
app.listen(port, () => {
  console.log(`✅ Express server running on port ${port}`);
});

// Export bot instance
module.exports = bot;
