// handlers/handleRequestLeave.js
const storage = require('../storage');
const { sendLoggedMessage } = require('../utils/logger');
// swap to moment‑jalaali so we can parse jYYYY/jMM/jDD
const moment = require('moment-jalaali');
moment.loadPersian({ usePersianDigits: false });

module.exports = function handleRequestLeave(bot, chatId, text, session, sessions, saveSessions) {
  if (!session.requestingLeave) return false;  // not in leave flow

  const lr = session.requestingLeave;

  // Step 1: Ask for reason
  if (lr.step === 'ask_date') {
    lr.date = text;
    lr.step = 'ask_reason';
    saveSessions(sessions);

    sendLoggedMessage(chatId,
      '✏️ لطفا دلیل مرخصی خود را وارد کنید. (اختیاری با ارسال کلمه هیچی از این مرحله عبور کنید)'
    );
    return true;
  }

  // Step 2: Finalize and notify managers
  if (lr.step === 'ask_reason') {
    lr.reason = (text && text !== 'هیچی') ? text : '';
    delete session.requestingLeave;
    saveSessions(sessions);

    // Acknowledge to employee
    sendLoggedMessage(chatId,
      `✅ درخواست مرخصی شما برای ${lr.date} ثبت شد و به مدیر ارسال خواهد شد.`
    );

    // Parse the Persian date and get the weekday name in Persian
    let weekday = '';
    try {
      weekday = moment(lr.date, 'jYYYY/jMM/jDD')
                  .format('dddd');    // returns e.g. "چهارشنبه"
    } catch (e) {
      weekday = ''; // if parsing fails, just omit
    }

    // Notify all managers
    const allUsers = storage.getAllUsers();
    for (const uname in allUsers) {
      const mgr = allUsers[uname];
      if (mgr.role === 'manager' && mgr.telegramId) {
        const dateLine = weekday
          ? `• تاریخ: ${lr.date} (${weekday})\n`
          : `• تاریخ: ${lr.date}\n`;

        bot.sendMessage(mgr.telegramId,
          `📩 درخواست مرخصی از ${session.username}:\n` +
          dateLine +
          (lr.reason ? `• دلیل: ${lr.reason}` : ''),
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '✔️ قبول', callback_data: `leave_approve_${chatId}` },
                { text: '❌ رد',   callback_data: `leave_reject_${chatId}` }
              ]]
            }
          }
        );
      }
    }

    return true;
  }

  return false;
};
