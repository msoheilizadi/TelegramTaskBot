const { sendLoggedMessage } = require('../../utils/logger');
const data = require('../../data.json');

module.exports = {
  pattern: /^\/notify$/,
  handler: (bot, msg, sessions, saveSessions) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Find user in data.json
    const user = Object.entries(data.users).find(([name, u]) => u.telegramId === userId);

    // Only allow Soheil
    if (!user || user[0] !== 'soheil') {
      return sendLoggedMessage(chatId, "⛔ شما اجازه استفاده از این فرمان را ندارید.");
    }

    // Now set step for Soheil
    if (!sessions[chatId]) sessions[chatId] = {};
    sessions[chatId].step = 'awaiting_broadcast_message';
    saveSessions(sessions);

    sendLoggedMessage(chatId, "📝 لطفاً پیامی که می‌خواهی برای همه ارسال شود را بنویس:");
  }
};
