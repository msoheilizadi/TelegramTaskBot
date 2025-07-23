const fs = require('fs');
const moment = require('moment-timezone');
const TIMEZONE = require('../config/timezone');
  const bot = require('../botInstance'); // we’ll create a singleton below

function sendLoggedMessage(chatId, message, options = {}) {
  const logTime = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm');
  const log = `[SEND] [${logTime}] To ${chatId}: ${message}\n`;
  fs.appendFileSync('logs.txt', log);
  

  return bot.sendMessage(chatId, message, options);
}

module.exports = { sendLoggedMessage };
