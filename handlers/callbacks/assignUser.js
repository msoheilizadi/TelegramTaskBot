const { sendLoggedMessage } = require('../../utils/logger');

module.exports = function assignUser(bot, query, sessions, saveSessions) {
  if (!query.data.startsWith('assign_')) return false;

  const chatId = query.message.chat.id;
  const targetUsername = query.data.split('_')[1];

  sessions[chatId].assignTo = targetUsername;
  sessions[chatId].addingForOther = true;
  saveSessions(sessions);

  sendLoggedMessage(
    chatId,
    `📝 عنوان تسکی که می‌خوای به ${targetUsername} بدی رو بنویس:`
  );

  return true;
};
