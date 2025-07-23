// handlers/callbacks/approveLeave.js
const { sendLoggedMessage } = require('../../utils/logger');

module.exports = function approveLeave(bot, query, sessions) {
  if (!query.data.startsWith('leave_approve_')) return false;

  const chatId = query.message.chat.id;
  const empChatId = parseInt(query.data.split('_')[2], 10);

  // Notify employee
  sendLoggedMessage(empChatId, '✅ درخواست مرخصی شما تایید شد.');

  // Confirm to manager
  sendLoggedMessage(chatId, '🎉 مرخصی تأیید شد.');

  return true;
};
