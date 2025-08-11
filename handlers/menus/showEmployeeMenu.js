const storage = require('../../storage');
const { sendLoggedMessage } = require('../../utils/logger');

function showEmployeeMenu(chatId, username) {
  const user = storage.getUser(username);
  const taskButtons = user.tasks.map(task => {
    const label = task.completed ? `✅ ${task.title}` : task.title;
    return [{ text: label, callback_data: `task_${task.id}` }];
  });

  taskButtons.push(
    [{ text: "➕ اضافه کردن تسک جدید", callback_data: "add_task" }],
    [{ text: "🔴 پایان روز کاری", callback_data: "end_day" }],
    [{ text: "📝 درخواست مرخصی", callback_data: "request_leave" }],
    [{ text: "📄 ایجاد پلن پرداخت", callback_data: "create_payment" }],
  );

  sendLoggedMessage(chatId, "📝 لیست کارهای امروز:", {
    reply_markup: { inline_keyboard: taskButtons }
  });
}

module.exports = showEmployeeMenu;
