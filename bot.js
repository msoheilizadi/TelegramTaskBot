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
const authenticateLocation = require("./locationAuth");
const startRemoteDay = require("./handlers/callbacks/startRemoteDay");
const showEmployeeMenu = require("./handlers/menus/showEmployeeMenu");

// Mock user database
let sessions = loadSessions(); // Logged-in users { telegramId: { username, role } }

bot.on("polling_error", (error) => {
  console.error("🛑 [polling_error] full error object:", error);
  if (error.stack) console.error(error.stack);
});

bot.onText(startCmd.pattern, (msg) => {
  startCmd.handler(bot, msg, sessions, saveSessions);
});

bot.onText(notifyCmd.pattern, (msg) => {
  notifyCmd.handler(bot, msg, sessions, saveSessions);
});

bot.onText(downloadLogsCmd.pattern, (msg) => {
  downloadLogsCmd.handler(bot, msg, sessions, saveSessions);
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
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  if (!sessions[chatId]?.username) {
    return sendLoggedMessage(
      chatId,
      "⚠️ لطفاً ابتدا /start را بزنید و وارد شوید."
    );
  }

  // try each handler in order
  if (viewAttendance(bot, query, sessions, saveSessions)) return;
  if (startDay(bot, query, sessions, saveSessions)) return;
  if (
    startRemoteDay(
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
  if (endDay(bot, query, sessions, saveSessions)) return;
  if (requestLeave(bot, query, sessions, saveSessions)) return;
  if (approveLeave(bot, query, sessions)) return;
  if (rejectLeave(bot, query, sessions)) return;
  if (viewUserTasks(bot, query, sessions, saveSessions)) return;

  // fallback
  sendLoggedMessage(chatId, "❓ دستور نامشخص.");
});

bot.on("location", (msg) => {
  authenticateLocation(
    bot,
    msg,
    sessions,
    saveSessions,
    (bot, chatId, username) => {
      showEmployeeMenu(chatId, username);
    }
  );
});

cron.schedule("0 0 * * *", () => {
  console.log("🌙 Midnight reset running...");

  const data = storage.readData();

  // For each user, reset day times and remove completed tasks
  for (const username in data.users) {
    const user = data.users[username];

    if (user.role === "employee") {
      // reset the workday markers
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
