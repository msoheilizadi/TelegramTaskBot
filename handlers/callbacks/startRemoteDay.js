// handlers/authenticateRemote.js
const moment = require("moment-timezone");;
require('moment-jalaali');
const { sendLoggedMessage } = require("../../utils/logger");
const storage = require("../../storage");
const {addStartDayTime} = require('../../storage/db/addClockToDb');
const { getUserIdByName } = require('../../storage/sessionManager');
const { getTodayPersianDate } = require('../../utils/dateHandling');
const showEmployeeMenu = require("../menus/showEmployeeMenu");

module.exports = async function authenticateRemote(
  bot,
  query,
  sessions,
  saveSessions,
  onSuccess
) {
  // only handle our “start_remote_day” callback
  if (query.data !== "start_remote_day") return false;

  const chatId = query.message.chat.id;
  const username = sessions[chatId]?.username;
  const user = storage.getUser(username);

  // ❗ guard: already started?
  if (user.dayStart) {
    sendLoggedMessage(chatId, "❗ شما قبلاً روز کاری‌تان را شروع کرده‌اید.");
    return true;
  }

  // mark remote start exactly like in-office
  delete sessions[chatId].step;
  saveSessions(sessions);

  const now = moment().tz("Asia/Tehran");
  user.dayStart = now.toISOString();
  user.dayEnd = null;

  storage.updateUser(username, user);

  const startTime = now.format("HH:mm");
  const endTime = now.clone().add(8, "hours").format("HH:mm");
  const persianDate = getTodayPersianDate(); // e.g. "05-26"

  const userid = getUserIdByName(username);

  await addStartDayTime(userid, persianDate, startTime);

  sendLoggedMessage(
    chatId,
    `✅ روز کاری دورکاری از ساعت ${startTime} شروع شد 💪\n🕒 حدود ساعت ${endTime} می‌تونی شیفتتو ببندی و بزنی بیرون! 😎`
  );

  showEmployeeMenu(chatId, username);

  // schedule the same 8‑hour reminder
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
