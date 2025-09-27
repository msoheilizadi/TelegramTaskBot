const { sendLoggedMessage } = require('../../utils/logger');
const data = require('../../data.json');

module.exports = {
  pattern: /\/notify_manager/,
  handler: (bot, msg, sessions, saveSessions) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Find user in data.json
    const user = Object.entries(data.users).find(
      ([name, u]) => u.telegramId === userId
    );

    // Only allow Soheil to trigger broadcast
    if (!user || user[0] !== 'soheil') {
      return sendLoggedMessage(
        chatId,
        "⛔ شما اجازه استفاده از این فرمان را ندارید."
      );
    }

    // Set step for manager broadcast
    if (!sessions[chatId]) sessions[chatId] = {};
    sessions[chatId].step = 'awaiting_manager_broadcast';
    saveSessions(sessions);

    sendLoggedMessage(
      chatId,
      "📝 لطفاً پیامی که می‌خواهی فقط برای مدیران ارسال شود را بنویس:"
    );
  }
};
