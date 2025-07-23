const { sendLoggedMessage } = require('../../utils/logger');
const storage = require('../../storage');

module.exports = function viewTask(bot, query, sessions, saveSessions) {
  if (!query.data.startsWith('task_')) return false;

  const chatId = query.message.chat.id;
  const taskId = parseInt(query.data.split('_')[1], 10);
  const username = sessions[chatId].username;
  const user = storage.getUser(username);
  const task = user.tasks.find(t => t.id === taskId);
  if (!task) return false;

  const options = [
    [{ text: '✅ اتمام تسک', callback_data: `complete_${taskId}` }],
    [{ text: '✏️ ویرایش تسک', callback_data: `edit_${taskId}` }]
  ];
  sendLoggedMessage(chatId, `تسک: ${task.title}`, {
    reply_markup: { inline_keyboard: options }
  });

  return true;
};
