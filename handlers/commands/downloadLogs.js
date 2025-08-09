const { sendLoggedMessage } = require('../../utils/logger');
const fs = require('fs');
const path = require('path');
const data = require('../../data.json');

module.exports = {
  pattern: /\/download_logs/,
  handler: (bot, msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Find user by Telegram ID
    const user = Object.entries(data.users).find(([name, u]) => u.telegramId === userId);
    if (!user || user[0] !== 'soheil') {
      return sendLoggedMessage(chatId, "⛔ شما اجازه استفاده از این فرمان را ندارید.");
    }

    const files = [
      { path: path.resolve(__dirname, '../../logs.txt'), caption: '🧾 logs.txt' },
      { path: path.resolve(__dirname, '../../sessions.json'), caption: '📋 sessions.json' },
      { path: path.resolve(__dirname, '../../data.json'), caption: '🗂 data.json' }
    ];

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        bot.sendDocument(chatId, file.path, { caption: file.caption });
      } else {
        sendLoggedMessage(chatId, `⚠️ فایل پیدا نشد: ${file.caption}`);
      }
    }
  }
};

