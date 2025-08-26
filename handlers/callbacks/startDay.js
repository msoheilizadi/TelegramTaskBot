const { sendLoggedMessage } = require("../../utils/logger");
const storage = require("../../storage");
const showEmployeeMenu = require("../menus/showEmployeeMenu");
const {addStartDayTime} = require('../../storage/db/addClockToDb');
const { getUserIdByName } = require('../../storage/sessionManager');
const { getTodayPersianDate } = require('../../utils/dateHandling');
const moment = require("moment-jalaali");
require("moment-timezone");

module.exports = async function startDay(bot, query, sessions, saveSessions) {
  if (query.data !== "start_day") return false;

  const chatId = query.message.chat.id;
  const username = sessions[chatId].username;
  const user = storage.getUser(username);

  // ✅ If user already started the day
  if (user.dayStart) {
    sendLoggedMessage(chatId, "❗ شما قبلاً روز کاری‌تان را شروع کرده‌اید.");
    showEmployeeMenu(chatId, username);
    return true;
  }

  // ✅ Ask for location only if day hasn't started
  // sessions[chatId].step = "waiting_for_location";
  // saveSessions(sessions);

  delete sessions[chatId].step;
  saveSessions(sessions);

  const now = moment().tz("Asia/Tehran");
  user.dayStart = now.toISOString();
  user.dayEnd = null;
  storage.updateUser(username, user);

  const startTime = now.format("HH:mm");
  const endTime = now.clone().add(8, "hours").format("HH:mm");
  const persianDate = getTodayPersianDate();

  const userid = getUserIdByName(username);

  await addStartDayTime(userid, persianDate, startTime);

  sendLoggedMessage(
    chatId,
    `✅ موقعیت مکانی تأیید شد و روز کاری از ساعت ${startTime} شروع شد 💪\n🕒 حدود ساعت ${endTime} می‌تونی شیفتتو ببندی و بروی بیرون! 😎`
  );

  showEmployeeMenu(chatId, username);

  // Reminder after 8 hours
  setTimeout(() => {
    const latest = storage.getUser(username);
    if (latest.dayStart && !latest.dayEnd) {
      sendLoggedMessage(
        chatId,
        "🕗 ۸ ساعت کاری تموم شد! هر وقت آماده بودی شیفتت رو تموم کن 😊"
      );
    }
  }, 8 * 60 * 60 * 1000);

  return true;
};
