const { sendLoggedMessage } = require('../utils/logger');
const storage = require('../storage');
const showEmployeeMenu = require('./menus/showEmployeeMenu');

module.exports = async function handleTaskAdd(chatId, text, session, sessions, saveSessions) {
  const username = session.username;
  const user = storage.getUser(username);
  const newId = user.tasks.length > 0 ? user.tasks[user.tasks.length - 1].id + 1 : 1;

  user.tasks.push({ id: newId, title: text, completed: false });
  storage.updateUser(username, user);

  sendLoggedMessage(chatId, `✅ کار اضافه شد: "${text}"`);
  session.addingTask = false;
  saveSessions(sessions);

  showEmployeeMenu(chatId, username);
};
