// handlers/callbacks/requestLeave.js
const { sendLoggedMessage } = require('../../utils/logger');

module.exports = function requestLeave(bot, query, sessions, saveSessions) {
  if (query.data !== 'request_leave') return false;

  const chatId = query.message.chat.id;
  sessions[chatId].requestingLeave = { step: 'ask_date' };
  saveSessions(sessions);

  sendLoggedMessage(chatId, "📅 لطفاً تاریخ شروع مرخصی را به فرمت YYYY-MM-DD وارد کنید:");
  return true;
};
