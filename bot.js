process.env.NTBA_FIX_350 = '1';
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const storage = require('./storage');
const cron = require('node-cron');
const fs = require('fs');
const sessionsFile = './sessions.json';
const moment = require('moment-timezone');


function sendLoggedMessage(chatId, message, options = {}) {
  const logTime = moment().tz("Asia/Tehran").format('YYYY-MM-DD HH:mm');
  const log = `[SEND] [${logTime}] To ${chatId}: ${message}\n`;
  fs.appendFileSync('logs.txt', log);
  return bot.sendMessage(chatId, message, options);
} 

function loadSessions() {
  try {
    const data = fs.readFileSync(sessionsFile, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    // File not found or corrupted -> return empty sessions object
    return {};
  }
}

function saveSessions() {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf-8');
}

// Mock user database
const sessions = loadSessions(); // Logged-in users { telegramId: { username, role } }

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  // initialize or reset this session
  sessions[chatId] = { step: 'await_contact' };
  saveSessions();
  sendLoggedMessage(chatId, "👋 سلام! لطفاً با زدن دکمه زیر شماره‌ موبایلت رو بفرست تا وارد بشی:" ,     {
      reply_markup: {
        keyboard: [
          [{ text: "📲 ارسال شماره تماس", request_contact: true }]
        ],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    }
  );
});



bot.onText(/\/notify/, (msg) => {
  const chatId = msg.chat.id;
  const username = sessions[chatId]?.username;

  if (username !== "soheil") {
    sendLoggedMessage(chatId, "⛔ شما اجازه استفاده از این فرمان را ندارید.");
    return;
  }

  sessions[chatId].step = 'awaiting_broadcast_message';
  saveSessions();

  sendLoggedMessage(chatId, "📝 لطفاً پیامی که می‌خواهی برای همه ارسال شود را بنویس:");
});


bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  const phone = msg.contact.phone_number;

  const data = storage.readData();

  // Find user by phone number directly in users
  const username = Object.keys(data.users).find(
    key => data.users[key].phone === phone
  );

  if (!username) {
    const msgText = '❌ این شماره در سیستم ثبت نشده!';
    return sendLoggedMessage(chatId, msgText);
  }

  // Save the session
  sessions[chatId] = {
    phone,
    username,
    step: "password"
  };
  saveSessions();

  const msgText = `✅ شماره‌ات دریافت شد: ${phone}\nرمز عبورت رو وارد کن لطفاً:`;
  sendLoggedMessage(chatId, msgText);
});

const path = require('path');

bot.onText(/\/download_logs/, (msg) => {
  const chatId = msg.chat.id;
  const username = sessions[chatId]?.username;

  if (username !== "soheil") {
    return sendLoggedMessage(chatId, "⛔ شما اجازه استفاده از این فرمان را ندارید.");
  }

  const files = [
    { path: path.resolve(__dirname, 'logs.txt'), caption: '🧾 logs.txt' },
    { path: path.resolve(__dirname, 'sessions.json'), caption: '📋 sessions.json' },
    { path: path.resolve(__dirname, 'data.json'), caption: '🗂 data.json' }
  ];

  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        bot.sendDocument(chatId, file.path, { caption: file.caption });
      } else {
        sendLoggedMessage(chatId, `⚠️ فایل پیدا نشد: ${file.caption}`);
      }
    } catch (err) {
      sendLoggedMessage(chatId, `❌ خطا در ارسال فایل ${file.caption}: ${err.message}`);
    }
  });
});


bot.getMe().then((botInfo) => {
    console.log(`✅ Bot is connected as @${botInfo.username}`);
}).catch((err) => {
    console.error('❌ Connection failed:', err.message);
});

// Handle messages for login
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const userLog = `${msg.from.username || msg.from.first_name} (${chatId})`;


    if (!msg.text || !sessions[chatId] || msg.text.startsWith('/')) return;


  // 🔁 1. Handle task editing if active
  if (sessions[chatId].editingTask) {
    const taskId = sessions[chatId].editingTask;
    const username = sessions[chatId].username;
    const user = storage.getUser(username);
    const task = user.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = text;
      storage.updateUser(username, user);
      sendLoggedMessage(chatId, `✏️ عنوان کار ویرایش شد: "${text}"`);
      sessions[chatId].editingTask = null;
      saveSessions();
      showEmployeeMenu(chatId, username);
    }
    return;
  }

    if (sessions[chatId].addingTask) {
        const username = sessions[chatId].username;
        const user = storage.getUser(username);
        const newId = user.tasks.length > 0 ? user.tasks[user.tasks.length - 1].id + 1 : 1;

        user.tasks.push({ id: newId, title: text, completed: false });
        storage.updateUser(username, user);

        sendLoggedMessage(chatId, `✅ کار اضافه شد: "${text}"`);
        sessions[chatId].addingTask = false;
        saveSessions();

        showEmployeeMenu(chatId, username);
    return;
    }

    
  // ✅ 3. Assign task to other
// ✅ Assigning task to another user (only when BOTH flags are valid)
if (
  sessions[chatId].addingForOther === true &&
  typeof sessions[chatId].assignTo === 'string'
) {
  const toUser = sessions[chatId].assignTo;
  const user = storage.getUser(toUser);

  if (!user) {
    sendLoggedMessage(chatId, `❌ کاربر "${toUser}" پیدا نشد.`);
    sessions[chatId].addingForOther = false;
    sessions[chatId].assignTo = null;
    saveSessions();
    return;
  }

  if (!Array.isArray(user.tasks)) {
    user.tasks = [];
  }

  const newId =
    user.tasks.length > 0
      ? user.tasks[user.tasks.length - 1].id + 1
      : 1;

  user.tasks.push({ id: newId, title: text, completed: false });
  storage.updateUser(toUser, user);

  sendLoggedMessage(chatId, `✅ تسک "${text}" با موفقیت به ${toUser} اختصاص داده شد.`);
    if (user.telegramId) {
    sendLoggedMessage(
      user.telegramId,
      `📥 برای شما یک تسک جدید اختصاص داده شده است:\n• ${text}`
    );
  }

  sessions[chatId].addingForOther = false;
  sessions[chatId].assignTo = null;
  saveSessions();
  return;
}

// Safety: if someone types early before selecting employee
if (sessions[chatId].addingForOther === true && !sessions[chatId].assignTo) {
  sendLoggedMessage(chatId, "⚠️ اول یه کارمند رو انتخاب کن.");
  sessions[chatId].addingForOther = false;
  saveSessions();
  return;
}



  // 🔁 2. Handle login steps
  const step = sessions[chatId].step;

  if (step === 'awaiting_broadcast_message') {
  const data = storage.getAllUsers();
  const broadcastMessage = text;

  let count = 0;
  for (const uname in data) {
    const user = data[uname];
    if (user.telegramId) {
      sendLoggedMessage(user.telegramId, broadcastMessage);
      count++;
    }
  }

  sendLoggedMessage(chatId, `📢 پیام برای ${count} کاربر ارسال شد.`);
  sessions[chatId].step = 'main';
  saveSessions();
  return;
}


  if (step === 'username') {
    const user = storage.getUser(text);
    if (!user) return sendLoggedMessage(chatId, "Username not found. Try again:");
    sessions[chatId].username = text;
    sessions[chatId].step = 'password';
    saveSessions();
    return sendLoggedMessage(chatId, "Enter your password:");
  }

  if (step === 'password') {
    const username = sessions[chatId].username;
    const user = storage.getUser(username);

    if (!user) {
      return sendLoggedMessage(chatId, "❌ User not found.");
    }

    if (user.password !== text) {
      return sendLoggedMessage(chatId, "❌ Wrong password. Try again:");
    }

    // Success: login user
    user.telegramId = chatId;
    storage.updateUser(username, user);

    sessions[chatId].role = user.role;
    sessions[chatId].step = 'main';
    saveSessions();

    if (user.role === 'employee') {
      sendLoggedMessage(chatId, "✅ سلام و وقت بخیر! برای شروع روز کاری‌تون، لطفاً دکمه زیر رو بزنید.", {
        reply_markup: {
          inline_keyboard: [[{ text: "🟢 شروع روز", callback_data: "start_day" }]]
        }
      });
    } else {
      sendLoggedMessage(chatId, "👋 سلام مدیر عزیز! دوست داری چه کاری انجام بدی؟", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📤 اختصاص تسک به کارمند", callback_data: "assign_task" }],
            [{ text: "📋 وضعیت حضور", callback_data: "view_attendance" }]
          ]
        }
      });
    }
  }



    }
);


// Show employee task menu
function showEmployeeMenu(chatId, username) {
  const user = storage.getUser(username);
  const taskButtons = user.tasks.map(task => {
    const label = task.completed ? `✅ ${task.title}` : task.title;
    return [{ text: label, callback_data: `task_${task.id}` }];
  });

  taskButtons.push(
    [{ text: "➕ اضافه کردن تسک جدید", callback_data: "add_task" }],
    [{ text: "🔴 پایان روز کاری", callback_data: "end_day" }]
  );

  sendLoggedMessage(chatId, "📝 لیست کارهای امروز:", {
    reply_markup: { inline_keyboard: taskButtons }
  });
}


// Handle task button clicks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const userSession = sessions[chatId];

  if (!userSession || !userSession.username) {
    sendLoggedMessage(chatId, "⚠️ لطفاً ابتدا /start را بزنید و وارد شوید.");
    return;
  }
  

  if (!userSession) return;

  const username = userSession.username;
if (data === 'view_attendance') {
  const allUsers = storage.getAllUsers();

  let presentList = '';
  let finishedList = '';
  let absentList = '';

  for (const username in allUsers) {
    const user = allUsers[username];

    if (user.role === 'employee') {
      // تاریخ شروع و پایان به صورت Date
    const startedDate = user.dayStart ? moment(user.dayStart).tz("Asia/Tehran") : null;
    const endedDate   = user.dayEnd   ? moment(user.dayEnd).tz("Asia/Tehran") : null;

      // تابع برای فرمت ساعت ۲۴ ساعته به فارسی (مثلاً ۱۶:۰۰)
      function formatTime(date) {
        if (!date) return '';
        return date.format('HH:mm');
      }


      const started = formatTime(startedDate);
      const ended = formatTime(endedDate);

      if (user.dayStart && !user.dayEnd) {
        presentList += `🟢 ${username} (شروع: ${started})\n`;
      } else if (user.dayStart && user.dayEnd) {
        finishedList += `🟡 ${username} (شروع: ${started} - پایان: ${ended})\n`;
      } else {
        absentList += `🔴 ${username}\n`;
      }
    }
  }

  const report = `📋 Attendance Report:\n\n` +
    `👥 فعال:\n${presentList || 'نداریم'}\n\n` +
    `✅ پایان‌یافته:\n${finishedList || 'نداریم'}\n\n` +
    `🚫 غایب:\n${absentList || 'نداریم'}`;

  sendLoggedMessage(chatId, report);
}



  // 🟢 Start Day
  if (data === 'start_day') {
    const user = storage.getUser(username);

    if (user.dayStart) {
      sendLoggedMessage(chatId, "❗ شما قبلاً روز کاری‌تان را شروع کرده‌اید.");
      showEmployeeMenu(chatId, username);
      return;
    }

    const now = moment().tz("Asia/Tehran");
    user.dayStart = now.toISOString(); // Save in ISO but from Tehran timezone
    user.dayEnd = null;
    storage.updateUser(username, user);

    const endTime = now.clone().add(8, 'hours');
    const formattedStart = now.format("HH:mm");
    const formattedEnd = endTime.format("HH:mm");

    sendLoggedMessage(chatId,
      `✅ روز کاری از ساعت ${formattedStart} شروع شد 💪\n🕒 حدود ساعت ${formattedEnd} می‌تونی شیفتتو ببندی و بزنی بیرون! 😎`
    );

    showEmployeeMenu(chatId, username);

    // Reminder after 8 hours (approximation, still uses server time for timeout)
    setTimeout(() => {
      const latest = storage.getUser(username);
      if (latest.dayStart && !latest.dayEnd) {
        sendLoggedMessage(chatId, "🕗 ۸ ساعت کاری تموم شد! هر وقت آماده بودی می‌تونی شیفتت رو تموم کنی و استراحت کنی 😊");
      }
    }, 8 * 60 * 60 * 1000);
  }



  // 📋 View a Task
  if (data.startsWith('task_')) {
    const taskId = parseInt(data.split('_')[1]);
    const user = storage.getUser(username);
    const task = user.tasks.find(t => t.id === taskId);

    if (!task) return;

    const options = [
      [{ text: '✅ اتمام تسک', callback_data: `complete_${taskId}` }],
      [{ text: '✏️ ویرایش تسک', callback_data: `edit_${taskId}` }]
    ];

    sendLoggedMessage(chatId, `تسک: ${task.title}`, {
      reply_markup: { inline_keyboard: options }
    });
  }
    if (data === 'assign_task') {
    const allUsers = storage.getAllUsers();
    const employeeButtons = Object.entries(allUsers)
        .filter(([_, u]) => u.role === 'employee')
        .map(([uname]) => [{ text: uname, callback_data: `assign_${uname}` }]);

    sendLoggedMessage(chatId, "👤 کارمند مورد نظر رو انتخاب کن:", {
        reply_markup: { inline_keyboard: employeeButtons }
    });
    return;  // ← stop here, don’t run the next handler
    }    
else if (data.startsWith('assign_')) {
  const targetUsername = data.split('_')[1];

  sessions[chatId].assignTo = targetUsername;
  sessions[chatId].addingForOther = true;
  saveSessions();

  sendLoggedMessage(chatId, `📝 عنوان تسکی که می‌خوای به ${targetUsername} بدی رو بنویس:`);
}



  // ✅ Complete a Task
  if (data.startsWith('complete_')) {
    const taskId = parseInt(data.split('_')[1]);
    const user = storage.getUser(username);
    const task = user.tasks.find(t => t.id === taskId);

    if (!task) return;

    task.completed = true;
    storage.updateUser(username, user);

    sendLoggedMessage(chatId, `✅ تسک "${task.title}" با موفقیت انجام شد.`);

    // Notify Managers
    const allUsers = storage.getAllUsers();
    for (const uname in allUsers) {
        const mgr = allUsers[uname];
        if (mgr.role === 'manager' && mgr.telegramId) {
          sendLoggedMessage(mgr.telegramId, `📢 کاربر ${username} تسک "${task.title}" را به پایان رساند.`);
        }
    }

        showEmployeeMenu(chatId, username);
    }





  // ✏️ Edit a Task
  if (data.startsWith('edit_')) {
    const taskId = parseInt(data.split('_')[1]);
    sessions[chatId].editingTask = taskId;
    saveSessions();
    sendLoggedMessage(chatId, "لطفاً عنوان جدید تسک را ارسال کنید:");
  }
    if (data === 'add_task') {
    sessions[chatId].addingTask = true;
    saveSessions();
    sendLoggedMessage(chatId, "📝 لطفاً عنوان تسک جدید را ارسال کنید:");
    }


  // 🔴 End Day
  if (data === 'end_day') {
    const user = storage.getUser(username);
    const now = moment().tz("Asia/Tehran");

    if (!user.dayStart) {
      return sendLoggedMessage(chatId, "⚠️ هنوز که روزت رو استارت نزدی!");
    }

    user.dayEnd = now.toISOString();
    const start = moment(user.dayStart).tz("Asia/Tehran");
    const durationMs = now.diff(start);
    const hours = Math.floor(durationMs / (60 * 60 * 1000));
    const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));


    const completedTasks = user.tasks.filter(t => t.completed);

    const report = `📅 گزارش روز کاری:\n👤 ${username}\n🕒 زمان کاری: ${hours} ساعت و ${minutes} دقیقه\n✅ تسک‌های انجام شده:\n` +
      (completedTasks.length
        ? completedTasks.map(t => `- ${t.title}`).join('\n')
        : 'None');

    sendLoggedMessage(chatId, `🔚 روز کاری به پایان رسید!\n\n${report}`);

    // Notify managers
    const allUsers = storage.getAllUsers();
    for (const uname in allUsers) {
      const mgr = allUsers[uname];
      if (mgr.role === 'manager' && mgr.telegramId) {
        sendLoggedMessage(mgr.telegramId, `📢 ${username} روز کاری خود را به پایان رساند:\n\n${report}`);
      }
    }

    // Reset for next day
    user.dayStart = null;
    user.dayEnd = null;
    user.tasks = user.tasks.filter(t => !t.completed);  // ✅ this removes completed tasks only
    storage.updateUser(username, user);
  }
});

cron.schedule('0 0 * * *', () => {
  console.log('🌙 Midnight reset running...');

  const data = storage.readData();

  // For each user, reset day times and remove completed tasks
  for (const username in data.users) {
    const user = data.users[username];

    if (user.role === 'employee') {
      // reset the workday markers
      user.dayStart = null;
      user.dayEnd   = null;

      // purge all completed tasks
      if (Array.isArray(user.tasks)) {
        user.tasks = user.tasks.filter(t => !t.completed);
      }
    }
  }

  // write changes back to data.json
  storage.writeData(data);
  console.log('✅ Daily reset complete.');
});

