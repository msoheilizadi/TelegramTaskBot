const { sendLoggedMessage } = require("../../utils/logger");
const storage = require("../../storage");
// load jalaali first, then timezone
const moment = require("moment-jalaali");
require("moment-timezone");

const {
  addEndDayTime,
  addMoneyToUsers,
} = require("../../storage/db/addClockToDb");
const { getUserIdByName } = require("../../storage/sessionManager");
const { addCompletedUserTask } = require("../../storage/db/addTasksToDb");

// Convert "HH:mm" string to decimal hours
function parseHoursToDecimal(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

// Convert decimal hours to "HH:mm" string
function formatDecimalToHHMM(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

module.exports = async function endDay(bot, query, sessions, saveSessions) {
  if (query.data !== "end_day") return false;

  const chatId = query.message.chat.id;
  const username = sessions[chatId].username;
  const user = storage.getUser(username);

  const now = moment().tz("Asia/Tehran");
  if (!user.dayStart) {
    sendLoggedMessage(chatId, "⚠️ هنوز که روزت رو استارت نزدی!");
    return true;
  }

  const endTime = now.format("HH:mm");
  const persianDate = now.format("jMM-jDD");
  const userid = getUserIdByName(username);
  const completedTasks = user.tasks.filter((t) => t.completed);

  try {
    await addEndDayTime(userid, persianDate, endTime);
    await addCompletedUserTask(userid, completedTasks, persianDate);
  } catch (error) {
    console.error("Error adding end day time:", error);
    return true;
  }

  user.dayEnd = now.toISOString();
  const start = moment(user.dayStart).tz("Asia/Tehran");
  const durationMs = now.diff(start);
  const hours = Math.floor(durationMs / (60 * 60 * 1000));
  const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
  const durationMinutes = Math.floor(durationMs / (60 * 1000));

  const dayOfWeek = now.day();
  const standardHours = dayOfWeek === 4 ? 4 : 8; // Thursday = 4h, other days = 8h

  const workedHoursDecimal = durationMinutes / 60; // total worked hours in decimal
  const balanceDecimal = workedHoursDecimal - standardHours; // balance can't be negative
  const balanceHHMM = formatDecimalToHHMM(balanceDecimal); // convert to "HH:mm" for PG

  const jDate = now.clone().format("jYYYY/jMM/jDD"); // for human-readable report

  // Update user's money in PostgreSQL
  try {
    await addMoneyToUsers(userid, workedHoursDecimal, balanceHHMM);
    console.log(
      `💰 Money updated for ${username}: worked ${workedHoursDecimal}h, balance ${balanceHHMM}`
    );
  } catch (err) {
    console.error("Error adding money for user:", username, err);
  }
  
  storage.updateUser(username, user);

  const report =
    `📅 گزارش روز کاری:\n👤 ${username}\n🕒 زمان کاری: ${hours} ساعت و ${minutes} دقیقه\n✅ تسک‌های انجام شده:\n` +
    (completedTasks.length
      ? completedTasks.map((t) => `- ${t.title}`).join("\n")
      : "None");

  sendLoggedMessage(chatId, `🔚 روز کاری به پایان رسید!\n\n${report}`);

  // Notify managers
  const allUsers = storage.getAllUsers();
  for (const uname in allUsers) {
    const mgr = allUsers[uname];
    if (mgr.role === "manager" && mgr.telegramId) {
      sendLoggedMessage(
        mgr.telegramId,
        `📢 ${username} روز کاری خود را به پایان رساند:\n\n${report}`
      );
    }
  }

  user.tasks = user.tasks.filter((t) => !t.completed);
  storage.updateUser(username, user);

  return true;
};
