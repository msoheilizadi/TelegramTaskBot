const { sendLoggedMessage } = require('../../utils/logger');

module.exports = function editTask(bot, query, sessions, saveSessions) {
  if (!query.data.startsWith('edit_')) return false;

  const chatId = query.message.chat.id;
  const taskId = parseInt(query.data.split('_')[1], 10);

  sessions[chatId].editingTask = taskId;
  saveSessions(sessions);

  sendLoggedMessage(chatId, 'لطفاً عنوان جدید تسک را ارسال کنید:');
  return true;
};
