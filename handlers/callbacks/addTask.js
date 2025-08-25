const { sendLoggedMessage } = require('../../utils/logger');

module.exports = function addTask(bot, query, sessions, saveSessions) {
  console.log("hello im in addTask callback");
  
  if (query.data !== 'add_task') return false;

  const chatId = query.message.chat.id;
  sessions[chatId].addingTask = true;
  saveSessions(sessions);

  sendLoggedMessage(chatId, '📝 لطفاً عنوان تسک جدید را ارسال کنید:');
  return true;
};
