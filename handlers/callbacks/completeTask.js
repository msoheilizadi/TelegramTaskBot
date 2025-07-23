const { sendLoggedMessage } = require('../../utils/logger');
const storage = require('../../storage');
const showEmployeeMenu = require('../menus/showEmployeeMenu');

module.exports = function completeTask(bot, query, sessions, saveSessions) {
  if (!query.data.startsWith('complete_')) return false;

  const chatId = query.message.chat.id;
  const username = sessions[chatId].username;
  const taskId = parseInt(query.data.split('_')[1], 10);
  const user = storage.getUser(username);
  const task = user.tasks.find(t => t.id === taskId);
  if (!task) return true; // nothing to do, but stop further handlers

  task.completed = true;
  storage.updateUser(username, user);

  sendLoggedMessage(
    chatId,
    `✅ تسک "${task.title}" با موفقیت انجام شد.`
  );

  // Notify managers
  const allUsers = storage.getAllUsers();
  for (const uname in allUsers) {
    const mgr = allUsers[uname];
    if (mgr.role === 'manager' && mgr.telegramId) {
      sendLoggedMessage(
        mgr.telegramId,
        `📢 کاربر ${username} تسک "${task.title}" را به پایان رساند.`
      );
    }
  }

  showEmployeeMenu(chatId, username);
  return true;
};
