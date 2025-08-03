const { sendLoggedMessage } = require('../../utils/logger');
const storage = require('../../storage');
const showEmployeeMenu = require('../menus/showEmployeeMenu');

module.exports = function startDay(bot, query, sessions, saveSessions) {
  if (query.data !== 'start_day') return false;

  const chatId = query.message.chat.id;
  const username = sessions[chatId].username;
  const user = storage.getUser(username);

  // ✅ If user already started the day
  if (user.dayStart) {
    sendLoggedMessage(chatId, '❗ شما قبلاً روز کاری‌تان را شروع کرده‌اید.');
    showEmployeeMenu(chatId, username);
    return true;
  }

  // ✅ Ask for location only if day hasn't started
  sessions[chatId].step = 'waiting_for_location';
  saveSessions(sessions);

  bot.sendMessage(chatId, '📍 لطفاً موقعیت مکانی خود را برای شروع روز کاری ارسال کنید (ابتدا لوکیشن خود را روشن کنید):', {
    reply_markup: {
      keyboard: [[{
        text: 'ارسال موقعیت مکانی 📍',
        request_location: true
      }]],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });

  return true;
};
