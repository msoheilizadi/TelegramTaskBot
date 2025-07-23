const { sendLoggedMessage } = require('../utils/logger');
const storage = require('../storage');

module.exports = async function handleLoginSteps(chatId, text, session, sessions, saveSessions) {
  if (session.step === 'awaiting_broadcast_message') {
    const data = storage.getAllUsers();
    let count = 0;
    for (const uname in data) {
      const user = data[uname];
      if (user.telegramId) {
        sendLoggedMessage(user.telegramId, text);
        count++;
      }
    }

    sendLoggedMessage(chatId, `📢 پیام برای ${count} کاربر ارسال شد.`);
    session.step = 'main';
    saveSessions(sessions);
    return;
  }

  if (session.step === 'username') {
    const user = storage.getUser(text);
    if (!user) return sendLoggedMessage(chatId, "Username not found. Try again:");
    session.username = text;
    session.step = 'password';
    saveSessions(sessions);
    return sendLoggedMessage(chatId, "Enter your password:");
  }

  if (session.step === 'password') {
    const user = storage.getUser(session.username);
    if (!user) return sendLoggedMessage(chatId, "❌ User not found.");
    if (user.password !== text) return sendLoggedMessage(chatId, "❌ Wrong password. Try again:");

    user.telegramId = chatId;
    storage.updateUser(session.username, user);
    session.role = user.role;
    session.step = 'main';
    saveSessions(sessions);

    if (user.role === 'employee') {
      return sendLoggedMessage(chatId, "✅ سلام و وقت بخیر! برای شروع روز کاری‌تون، لطفاً دکمه زیر رو بزنید.", {
        reply_markup: {
          inline_keyboard: [[{ text: "🟢 شروع روز", callback_data: "start_day" }]]
        }
      });
    }

    return sendLoggedMessage(chatId, "👋 سلام مدیر عزیز! دوست داری چه کاری انجام بدی؟", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📤 اختصاص تسک به کارمند", callback_data: "assign_task" }],
          [{ text: "📋 وضعیت حضور", callback_data: "view_attendance" }]
        ]
      }
    });
  }
};
