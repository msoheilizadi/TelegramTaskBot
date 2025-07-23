const { sendLoggedMessage } = require('../utils/logger');
const storage = require('../storage');

module.exports = async function handleAssignTask(chatId, text, session, sessions, saveSessions) {
  const toUser = session.assignTo;
  if (!toUser) {
    sendLoggedMessage(chatId, "⚠️ اول یه کارمند رو انتخاب کن.");
    session.addingForOther = false;
    saveSessions(sessions);
    return;
  }

  const user = storage.getUser(toUser);
  if (!user) {
    sendLoggedMessage(chatId, `❌ کاربر "${toUser}" پیدا نشد.`);
    session.addingForOther = false;
    session.assignTo = null;
    saveSessions(sessions);
    return;
  }

  const newId = user.tasks.length > 0 ? user.tasks[user.tasks.length - 1].id + 1 : 1;
  user.tasks.push({ id: newId, title: text, completed: false });
  storage.updateUser(toUser, user);

  sendLoggedMessage(chatId, `✅ تسک "${text}" با موفقیت به ${toUser} اختصاص داده شد.`);
  if (user.telegramId) {
    sendLoggedMessage(user.telegramId, `📥 برای شما یک تسک جدید اختصاص داده شده است:\n• ${text}`);
  }

  session.addingForOther = false;
  session.assignTo = null;
  saveSessions(sessions);
};
