const { sendLoggedMessage } = require('../../utils/logger');
const data = require('../../data.json');
const { syncTasks } = require('../../storage');

module.exports = {
  pattern: /\/update_tasks/,
  handler: async (bot, msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Find user by Telegram ID
    const user = Object.entries(data.users).find(([name, u]) => u.telegramId === userId);

    // Only allow 'soheil'
    if (!user || user[0] !== 'soheil') {
      return sendLoggedMessage(chatId, "⛔ شما اجازه استفاده از این فرمان را ندارید.");
    }

    sendLoggedMessage(chatId, "⏳ در حال به‌روزرسانی تسک‌ها از دیتابیس...");

    try {
      await syncTasks(); // run your syncTasks function
      sendLoggedMessage(chatId, "✅ به‌روزرسانی تسک‌ها با موفقیت انجام شد.");
    } catch (err) {
      console.error(err);
      sendLoggedMessage(chatId, "❌ خطا در هنگام به‌روزرسانی تسک‌ها از دیتابیس.");
    }
  }
};
