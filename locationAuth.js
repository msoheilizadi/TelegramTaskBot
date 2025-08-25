// // locationAuth.js
// const moment = require('moment-timezone');
// require('moment-jalaali');
// const { sendLoggedMessage } = require('./utils/logger');
// const storage = require('./storage');
// const {addStartDayTime} = require('./storage/db/addClockToDb');
// const { getUserIdByName } = require('./storage/sessionManager');
// const { getTodayPersianDate } = require('./utils/dateHandling');


// const OFFICE_LAT = 35.802306;
// const OFFICE_LNG = 51.456083;
// const ALLOWED_DISTANCE_METERS = 100;

// function haversineDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371e3; // Radius of Earth in meters
//   const toRad = x => x * Math.PI / 180;
//   const φ1 = toRad(lat1), φ2 = toRad(lat2);
//   const Δφ = toRad(lat2 - lat1);
//   const Δλ = toRad(lon2 - lon1);

//   const a = Math.sin(Δφ / 2) ** 2 +
//             Math.cos(φ1) * Math.cos(φ2) *
//             Math.sin(Δλ / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// module.exports = async function authenticateLocation(bot, msg, sessions, saveSessions, onSuccess) {
//   const chatId = msg.chat.id;
//   const session = sessions[chatId];
//   if (!session || session.step !== 'waiting_for_location') return;

//   const username = session.username;
//   const location = msg.location;

//   const distance = haversineDistance(
//     location.latitude, location.longitude,
//     OFFICE_LAT, OFFICE_LNG
//   );

//   // ✅ Option 1: Check GPS accuracy if provided
//   if ('horizontal_accuracy' in location && location.horizontal_accuracy > 100) {
//     sendLoggedMessage(chatId, '⚠️ دقت موقعیت مکانی پایین است و ممکن است انتخاب دستی باشد. لطفاً از "مکان فعلی" استفاده کنید.');
//     return;
//   }

//   if (distance <= ALLOWED_DISTANCE_METERS) {
//     // Location is accepted
//     delete sessions[chatId].step;
//     saveSessions(sessions);

//     const user = storage.getUser(username);
//     const now = moment().tz('Asia/Tehran');
//     user.dayStart = now.toISOString();
//     user.dayEnd = null;
//     storage.updateUser(username, user);

//     const startTime = now.format('HH:mm');
//     const endTime   = now.clone().add(8, 'hours').format('HH:mm');
//     const persianDate = getTodayPersianDate();

//     const userid = getUserIdByName(username);

//     await addStartDayTime(userid, persianDate, startTime);
    
//     sendLoggedMessage(
//       chatId,
//       `✅ موقعیت مکانی تأیید شد و روز کاری از ساعت ${startTime} شروع شد 💪\n🕒 حدود ساعت ${endTime} می‌تونی شیفتتو ببندی و بروی بیرون! 😎`
//     );
    
//     onSuccess(bot, chatId, username); // continue to employee menu or anything else

//     // Reminder after 8 hours
//     setTimeout(() => {
//       const latest = storage.getUser(username);
//       if (latest.dayStart && !latest.dayEnd) {
//         sendLoggedMessage(chatId, '🕗 ۸ ساعت کاری تموم شد! هر وقت آماده بودی شیفتت رو تموم کن 😊');
//       }
//     }, 8 * 60 * 60 * 1000);

//   } else {
//     sendLoggedMessage(chatId, `❗ موقعیت تأیید نشد. شما ${Math.round(distance)} متر با محل کار فاصله دارید.`);
//   }
// };

