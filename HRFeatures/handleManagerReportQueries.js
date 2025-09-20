const { getAllEmployees } = require("../storage/sessionManager");
const { getAttendanceByUser } = require("../storage/db/getReportsFromDb");

// helper: sum HH:MM durations
function sumWorktimes(records) {
  let totalMinutes = 0;

  records.forEach((r) => {
    if (!r.worktime) return;
    const [h, m] = r.worktime.split(":").map(Number);
    totalMinutes += h * 60 + m;
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

async function handleManagerQueries(bot, query, sessions, saveSessions, sendLoggedMessage) {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!sessions[chatId]?.username) {
    sendLoggedMessage(chatId, "⚠️ لطفاً ابتدا /start را بزنید و وارد شوید.");
    return true;
  }

  // Manager clicked: show all employees
  if (data === "view_employees") {
    const employees = getAllEmployees();

    if (!employees.length) {
      sendLoggedMessage(chatId, "❌ هیچ کارمندی در users.json یافت نشد.");
      return true;
    }

    const keyboard = employees.map((user) => [
      {
        text: user.name,
        callback_data: `report_user_${user.id}`,
      },
    ]);

    sendLoggedMessage(chatId, "👥 لطفاً یک کارمند را انتخاب کنید:", {
      reply_markup: { inline_keyboard: keyboard },
    });
    return true;
  }

  // Manager selected employee -> show attendance + total
  if (data.startsWith("report_user_")) {
    const userid = data.replace("report_user_", "");
    const employees = getAllEmployees();
    const employee = employees.find((u) => String(u.id) === userid);

    const month = "06"; // TODO: replace with dynamic Persian month
    const records = await getAttendanceByUser(userid, month);

    if (!records.length) {
      sendLoggedMessage(chatId, `❌ هیچ گزارشی برای ${employee?.name || userid} یافت نشد.`);
      return true;
    }

    let text = `📊 گزارش حضور برای ${employee?.name || "کارمند"} (ID: ${userid}) در ماه ${month}\n\n`;
    records.forEach((r) => {
      text += `🗓 ${r.date} | ⏰ ${r.start} - ${r.end} | ⌛ ${r.worktime}\n`;
    });

    // add total worktime
    const total = sumWorktimes(records);
    text += `\n🕒 مجموع ساعات کاری: ${total}`;

    sendLoggedMessage(chatId, text);
    return true;
  }

  return false;
}

module.exports = handleManagerQueries;
