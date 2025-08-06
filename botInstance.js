require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.TELEGRAM_TOKEN;
const port = process.env.PORT || 3000;
const webhookDomain = process.env.BOT_WEBHOOK_URL;

if (typeof token !== 'string' || !token.trim()) {
  throw new Error('TELEGRAM_TOKEN is not defined or not a string');
}

if (!webhookDomain) {
  throw new Error('WEBHOOK_URL is not defined');
}

// Initialize bot in webhook mode
const bot = new TelegramBot(token, { webHook: true });

// Express app to handle webhook
const app = express();
app.use(express.json());

// This endpoint will be called by Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.setWebHook(`${webhookDomain}/bot${token}`);

app.listen(port, () => {
  console.log(`🚀 Express server is running on port ${port}`);
  bot.getMe()
    .then(botInfo => {
      console.log(`✅ Bot @${botInfo.username} is connected and webhook is set!`);
    })
    .catch(err => {
      console.error('❌ Failed to connect to Telegram API:', err);
    });
});

module.exports = bot;
