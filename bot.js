process.env.NTBA_FIX_350 = "1";
const bot = require("./botInstance");
const storage = require("./storage");
const cron = require("node-cron");
const { sendLoggedMessage } = require("./utils/logger");
const { loadSessions, saveSessions } = require("./storage/sessionManager");
const handleMessage = require("./handlers/messageHandler");
const startCmd = require("./handlers/commands/start");
const notifyCmd = require("./handlers/commands/notify");
const downloadLogsCmd = require("./handlers/commands/downloadLogs");
const monthlyReportCmd = require("./handlers/commands/monthlyReport");
const viewAttendance = require("./handlers/callbacks/viewAttendance");
const startDay = require("./handlers/callbacks/startDay");
const viewTask = require("./handlers/callbacks/viewTask");
const assignMenu = require("./handlers/callbacks/assignTaskMenu");
const assignUser = require("./handlers/callbacks/assignUser");
const completeTask = require("./handlers/callbacks/completeTask");
const editTask = require("./handlers/callbacks/editTask");
const addTask = require("./handlers/callbacks/addTask");
const endDay = require("./handlers/callbacks/endDay");
const requestLeave = require("./handlers/callbacks/requestLeave");
const approveLeave = require("./handlers/callbacks/approveLeave");
const rejectLeave = require("./handlers/callbacks/rejectLeave");
const viewUserTasks = require("./handlers/viewUserTask");
// const authenticateLocation = require("./locationAuth");
const handleManagerQueries = require("./HRFeatures/handleManagerReportQueries");
const startRemoteDay = require("./handlers/callbacks/startRemoteDay");
const showEmployeeMenu = require("./handlers/menus/showEmployeeMenu");
const handlePaymentFlow = require("./handlers/callbacks/create_payment");
const updateTaskCmd = require("./handlers/commands/updateDb");
const moment = require("moment-jalaali");
require("moment-timezone");
const { updateAedRate } = require("./Api/getAedRate");

// Mock user database
let sessions = loadSessions(); // Logged-in users { telegramId: { username, role } }

bot.onText(startCmd.pattern, (msg) => {
  startCmd.handler(bot, msg, sessions, saveSessions);
});

bot.onText(notifyCmd.pattern, (msg) => {
  notifyCmd.handler(bot, msg, sessions, saveSessions);
});

bot.onText(downloadLogsCmd.pattern, (msg) => {
  downloadLogsCmd.handler(bot, msg, sessions, saveSessions);
});

bot.onText(updateTaskCmd.pattern, (msg) => {
  updateTaskCmd.handler(bot, msg, sessions, saveSessions);
});

bot.onText(monthlyReportCmd.pattern, (msg) => {
  monthlyReportCmd.handler(bot, msg, sessions, saveSessions);
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  const phone = msg.contact.phone_number;

  const data = storage.readData();

  // Find user by phone number directly in users
  const username = Object.keys(data.users).find(
    (key) => data.users[key].phone === phone
  );

  if (!username) {
    const msgText = "❌ این شماره در سیستم ثبت نشده!";
    return sendLoggedMessage(chatId, msgText);
  }

  // Save the session
  sessions[chatId] = {
    phone,
    username,
    step: "password",
  };
  saveSessions(sessions);

  const msgText = `✅ شماره‌ات دریافت شد: ${phone}\nرمز عبورت رو وارد کن لطفاً:`;
  sendLoggedMessage(chatId, msgText);
});

// Handle messages for login
bot.on("message", async (msg) => {
  await handleMessage(bot, msg, sessions, saveSessions);
});

// Handle task button clicks
bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    if (!sessions[chatId]?.username) {
      return sendLoggedMessage(
        chatId,
        "⚠️ لطفاً ابتدا /start را بزنید و وارد شوید."
      );
    }

    if (viewAttendance(bot, query, sessions, saveSessions)) return;

    if (await startDay(bot, query, sessions, saveSessions)) return;
    if (
      await startRemoteDay(
        bot,
        query,
        sessions,
        saveSessions,
        (bot, chatId, username) => {
          showEmployeeMenu(chatId, username);
        }
      )
    )
      return;
    if (viewTask(bot, query, sessions, saveSessions)) return;
    if (assignMenu(bot, query, sessions, saveSessions)) return;
    if (assignUser(bot, query, sessions, saveSessions)) return;
    if (completeTask(bot, query, sessions, saveSessions)) return;
    if (editTask(bot, query, sessions, saveSessions)) return;
    if (addTask(bot, query, sessions, saveSessions)) return;
    if (await endDay(bot, query, sessions, saveSessions)) return;
    if (requestLeave(bot, query, sessions, saveSessions)) return;
    if (approveLeave(bot, query, sessions)) return;
    if (rejectLeave(bot, query, sessions)) return;
    if (viewUserTasks(bot, query, sessions, saveSessions)) return;
    if (handlePaymentFlow(bot, query, sessions, saveSessions)) return;
    if (
      handleManagerQueries(
        bot,
        query,
        sessions,
        saveSessions,
        sendLoggedMessage
      )
    )
      return;

    // fallback
    sendLoggedMessage(chatId, "❓ دستور نامشخص.");
  } catch (error) {
    console.error("Error handling callback_query:", error);
    sendLoggedMessage(
      query.message.chat.id,
      "❌ خطا در پردازش درخواست. لطفاً دوباره امتحان کنید."
    );
  }
});

// bot.on("location", (msg) => {
//   authenticateLocation(
//     bot,
//     msg,
//     sessions,
//     saveSessions,
//     (bot, chatId, username) => {
//       showEmployeeMenu(chatId, username);
//     }
//   );
// });

cron.schedule("0 0 * * *", () => {
  console.log("🌙 Midnight reset running...");

  const data = storage.readData();
  const now = moment().tz("Asia/Tehran");

  const dayOfWeek = now.day();

  // For each user, reset day times and remove completed tasks
  for (const username in data.users) {
    const user = data.users[username];

    if (user.role === "employee") {
      if (dayOfWeek === 5 || dayOfWeek == 4) {
        console.log(`📌 ${username} skipped (Friday).`);
        continue;
      }

      if (!user.dayStart && !user.dayEnd && user.telegramId) {
        sendLoggedMessage(
          user.telegramId,
          `🌙 ${username} عزیز، چون امروز روز کاری‌تو استارت نزدی، به عنوان *مرخصی* برات ثبت شد.`
        );
      }
      user.dayStart = null;
      user.dayEnd = null;

      // purge all completed tasks
      if (Array.isArray(user.tasks)) {
        user.tasks = user.tasks.filter((t) => !t.completed);
      }
    }
  }

  // write changes back to data.json
  storage.writeData(data);
  console.log("✅ Daily reset complete.");
});

cron.schedule(
  "0 21 * * *",
  () => {
    console.log("📥 Triggering automatic downloadLogsCmd...");

    const adminChatId = 668058250;

    // Ensure session for auto-run
    if (!sessions[adminChatId]) {
      sessions[adminChatId] = { username: "soheil" };
      saveSessions(sessions);
    }

    const fakeMsg = {
      chat: { id: adminChatId },
      from: { id: adminChatId },
      text: "/download_logs",
    };

    downloadLogsCmd.handler(bot, fakeMsg, sessions);
  },
  {
    timezone: "Asia/Tehran",
  }
);

// 🔔 11 AM Reminder: forgot to start the day
cron.schedule(
  "0 11 * * *",
  () => {
    console.log("⏰ 11 AM check: users who didn’t start their day...");

    const data = storage.readData();
    const now = moment().tz("Asia/Tehran");
    const dayOfWeek = now.day();

    for (const username in data.users) {
      const user = data.users[username];

      if (dayOfWeek === 5 || dayOfWeek === 4) {
        console.log(`📌 ${username} skipped (Friday).`);
        continue;
      }

      if (user.role === "employee" && !user.dayStart && user.telegramId) {
        sendLoggedMessage(
          user.telegramId,
          `🌞 سلام ${username} عزیز!  
یادت نره روز کاری‌ت رو استارت بزنی تا بتونیم باهم پیشرفت‌هامون رو ثبت کنیم ✨`
        );
      }
    }
  },
  { timezone: "Asia/Tehran" }
);

// 🔔 7 PM Reminder: forgot to end the day
cron.schedule(
  "0 19 * * *",
  () => {
    console.log("⏰ 7 PM check: users who didn’t end their day...");

    const data = storage.readData();

    for (const username in data.users) {
      const user = data.users[username];
      if (
        user.role === "employee" &&
        user.dayStart &&
        !user.dayEnd &&
        user.telegramId
      ) {
        sendLoggedMessage(
          user.telegramId,
          `🌙 ${username} جان، روز کاری داره تموم میشه!  
خوبه که الان دکمه‌ی پایان روز رو بزنی تا گزارش قشنگی از کارت ثبت بشه ✅`
        );
      }
    }
  },
  { timezone: "Asia/Tehran" }
);

cron.schedule(
  "0 10,16 * * *", // minute 0, hours 10 and 16, every day
  () => {
    console.log("🌐 Updating AED rate...");
    updateAedRate();
  },
  {
    timezone: "Asia/Tehran",
  }
);