const { sendLoggedMessage } = require('../../utils/logger');

module.exports = {
  pattern: /\/notify/,
  handler: (bot, msg, sessions, saveSessions) => {
    const chatId = msg.chat.id;
    const username = sessions[chatId]?.username;
    if (username !== 'soheil') {
      return sendLoggedMessage(chatId, "⛔ شما اجازه استفاده از این فرمان را ندارید.");
    }
    sessions[chatId].step = 'awaiting_broadcast_message';
    saveSessions(sessions);
    sendLoggedMessage(chatId, "📝 لطفاً پیامی که می‌خواهی برای همه ارسال شود را بنویس:");
  }
};
