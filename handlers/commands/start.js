const { sendLoggedMessage } = require('../../utils/logger');

module.exports = {
  pattern: /\/start/,
  handler: (bot, msg, sessions, saveSessions) => {
    const chatId = msg.chat.id;
    sessions[chatId] = { step: 'await_contact' };
    saveSessions(sessions);
    sendLoggedMessage(chatId, "👋 سلام! لطفاً با زدن دکمه زیر شماره‌ موبایلت رو بفرست تا وارد بشی:", {
      reply_markup: {
        keyboard: [[{ text: "📲 ارسال شماره تماس", request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
  }
};
