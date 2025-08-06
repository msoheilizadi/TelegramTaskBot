require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const botUrl = process.env.BOT_WEBHOOK_URL; // e.g., https://your-app.up.railway.app
const port = process.env.PORT || 3000;

if (!token || !botUrl) throw new Error('Missing TELEGRAM_TOKEN or BOT_WEBHOOK_URL');

const app = express();
app.use(express.json());

const bot = new TelegramBot(token, { webHook: { port } });

bot.setWebHook(`${botUrl}/bot${token}`);

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Bot is running'));

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
