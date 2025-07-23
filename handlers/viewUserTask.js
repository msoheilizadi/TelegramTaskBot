const storage = require('../storage');
const { sendLoggedMessage } = require('../utils/logger');

module.exports = function viewUserTasks(bot, query, sessions, saveSessions) {
  const chatId = query.message.chat.id;
  const dataText = query.data;

  // 1. Manager clicked to view employee list
  if (dataText === "view_tasks") {
    const allUsers = storage.getAllUsers();
    const keyboard = Object.entries(allUsers)
      .filter(([_, u]) => u.role === "employee")
      .map(([username]) => [{ text: username, callback_data: `view_tasks_of_${username}` }]);

    if (keyboard.length === 0) {
      sendLoggedMessage(chatId, "❌ هیچ کارمندی یافت نشد.");
      return true;
    }

    sendLoggedMessage(chatId, "👤 لطفاً یک کارمند را انتخاب کنید:", {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    return true;
  }

  // 2. Manager clicked on a specific employee
  if (dataText.startsWith("view_tasks_of_")) {
    const username = dataText.replace("view_tasks_of_", "");
    const user = storage.getUser(username);

    if (!user) {
      sendLoggedMessage(chatId, `❌ کاربر "${username}" پیدا نشد.`);
      return true;
    }

    const tasks = user.tasks || [];
    if (tasks.length === 0) {
      sendLoggedMessage(chatId, `📭 "${username}" هیچ تسکی ندارد.`);
      return true;
    }

    const taskList = tasks
        .map((t, i) => {
            const status = t.done ? "✅" : "🔘";
            return `${status} *${t.title}*\nID: ${t.id}`;
        })
        .join("\n\n")

    sendLoggedMessage(chatId, `🗂 تسک‌های کاربر *${username}*:\n\n${taskList}`, {
      parse_mode: "Markdown"
    });
    return true;
  }

  return false;
};
