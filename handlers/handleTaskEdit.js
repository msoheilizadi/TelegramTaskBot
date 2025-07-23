const { sendLoggedMessage } = require('../utils/logger');
const storage = require('../storage');

module.exports = async function handleTaskEdit(chatId, text, session, sessions, saveSessions) {
  const taskId = session.editingTask;
  const username = session.username;
  const user = storage.getUser(username);
  const task = user.tasks.find(t => t.id === taskId);

  if (task) {
    task.title = text;
    storage.updateUser(username, user);
    sendLoggedMessage(chatId, `✏️ عنوان کار ویرایش شد: "${text}"`);
    session.editingTask = null;
    saveSessions(sessions);
  }
};
