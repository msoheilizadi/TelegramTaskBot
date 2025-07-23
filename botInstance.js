require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;

if (typeof token !== 'string' || !token.trim()) {
  throw new Error('TELEGRAM_TOKEN is not defined or not a string');
}

const bot = new TelegramBot(token, { polling: true });

bot.getMe()
  .then(botInfo => {
    console.log(`✅ Bot @${botInfo.username} is connected to the Telegram API and ready!`);
  })
  .catch(err => {
    console.error('❌ Failed to connect to Telegram API:', err);
  });

module.exports = bot;
