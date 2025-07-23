// handlers/callbacks/rejectLeave.js
const { sendLoggedMessage } = require('../../utils/logger');

module.exports = function rejectLeave(bot, query, sessions) {
  if (!query.data.startsWith('leave_reject_')) return false;

  const chatId = query.message.chat.id;
  const empChatId = parseInt(query.data.split('_')[2], 10);

  // Notify employee
  sendLoggedMessage(empChatId, '❌ درخواست مرخصی شما رد شد.');

  // Confirm to manager
  sendLoggedMessage(chatId, '🛑 مرخصی رد شد.');

  return true;
};
