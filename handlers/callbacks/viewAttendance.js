const { sendLoggedMessage } = require('../../utils/logger');
const storage = require('../../storage');
const moment = require('moment-timezone');

module.exports = function viewAttendance(bot, query, sessions, saveSessions) {
  if (query.data !== 'view_attendance') return false;

  const chatId = query.message.chat.id;
  const allUsers = storage.getAllUsers();

  let presentList = '', finishedList = '', absentList = '';
  for (const uname in allUsers) {
    const u = allUsers[uname];
    if (u.role !== 'employee') continue;
    const start = u.dayStart && moment(u.dayStart).tz('Asia/Tehran').format('HH:mm');
    const end   = u.dayEnd   && moment(u.dayEnd).tz('Asia/Tehran').format('HH:mm');

    if (u.dayStart && !u.dayEnd)     presentList  += `🟢 ${uname} (شروع: ${start})\n`;
    else if (u.dayStart && u.dayEnd) finishedList += `🟡 ${uname} (شروع: ${start} - پایان: ${end})\n`;
    else                              absentList   += `🔴 ${uname}\n`;
  }

  const report =
    `📋 Attendance Report:\n\n👥 فعال:\n${presentList || 'نداریم'}\n\n` +
    `✅ پایان‌یافته:\n${finishedList || 'نداریم'}\n\n🚫 غایب:\n${absentList || 'نداریم'}`;
  sendLoggedMessage(chatId, report);

  return true;
};
