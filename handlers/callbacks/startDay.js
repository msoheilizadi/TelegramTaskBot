const { sendLoggedMessage } = require('../../utils/logger');
const storage = require('../../storage');
const moment = require('moment-timezone');
const showEmployeeMenu = require('../menus/showEmployeeMenu');

module.exports = function startDay(bot, query, sessions, saveSessions) {
  if (query.data !== 'start_day') return false;

  const chatId = query.message.chat.id;
  const username = sessions[chatId].username;
  const user = storage.getUser(username);

  if (user.dayStart) {
    sendLoggedMessage(chatId, '❗ شما قبلاً روز کاری‌تان را شروع کرده‌اید.');
    showEmployeeMenu(chatId, username);
    return true;
  }

  const now = moment().tz('Asia/Tehran');
  user.dayStart = now.toISOString();
  user.dayEnd   = null;
  storage.updateUser(username, user);

  const endTime = now.clone().add(8, 'hours');
  sendLoggedMessage(
    chatId,
    `✅ روز کاری از ساعت ${now.format('HH:mm')} شروع شد 💪\n` +
    `🕒 حدود ساعت ${endTime.format('HH:mm')} می‌تونی شیفتتو ببندی و بزنی بیرون! 😎`
  );

  showEmployeeMenu(chatId, username);

  setTimeout(() => {
    const latest = storage.getUser(username);
    if (latest.dayStart && !latest.dayEnd) {
      sendLoggedMessage(
        chatId,
        '🕗 ۸ ساعت کاری تموم شد! هر وقت آماده بودی می‌تونی شیفتت رو تموم کنی و استراحت کنی 😊'
      );
    }
  }, 8 * 60 * 60 * 1000);

  return true;
};
