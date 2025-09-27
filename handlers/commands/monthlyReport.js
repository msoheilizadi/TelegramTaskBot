const fs = require("fs");
const path = require("path");
const { getAllEmployees } = require("../../storage/sessionManager");
const {
  getAttendanceByUser,
  getDoneTasksByUser,
} = require("../../storage/db/getReportsFromDb");
const { sendLoggedMessage } = require("../../utils/logger");
const { sumWorktimes } = require("../../HRFeatures/handleManagerReportQueries");
const { spawn } = require("child_process");

function generatePdfFromPython(employeeReports, month, outputPath) {
  return new Promise((resolve, reject) => {
    const pyPath = path.join(__dirname, "../../HRFeatures/generate_pdf.py");
    const reportsJson = JSON.stringify(employeeReports);
    const pythonBin = process.env.PY_BIN || "python3";

    const pyProcess = spawn(pythonBin, [
      pyPath,
      reportsJson,
      month,
      outputPath,
    ]);

    let stdout = "";
    let stderr = "";

    pyProcess.stdout.on("data", (data) => (stdout += data.toString()));
    pyProcess.stderr.on("data", (data) => (stderr += data.toString()));

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python error:", stderr);
        return reject(new Error(stderr));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error("PDF file not created"));
      }

      resolve();
    });
  });
}

module.exports = {
  pattern: /^\/monthly_report$/,
  handler: async (bot, msg, sessions, saveSessions) => {
    const chatId = msg.chat.id;
    const username = sessions[chatId]?.username;

    // ✅ Only soheil can run it
    if (username !== "soheil") {
      return sendLoggedMessage(
        chatId,
        "⛔ شما اجازه اجرای این دستور را ندارید."
      );
    }

    const employees = getAllEmployees();
    if (!employees.length) {
      return sendLoggedMessage(chatId, "❌ هیچ کارمندی یافت نشد.");
    }

    const month = "06";

    for (const emp of employees) {
      const records = await getAttendanceByUser(emp.id, month);

      if (!records.length) {
        await sendLoggedMessage(
          chatId,
          `❌ هیچ گزارشی برای ${emp.name} یافت نشد.`
        );
        continue;
      }

      let text = `📊 گزارش حضور برای ${emp.name} (ID: ${emp.id}) در ماه ${month}\n\n`;
      records.forEach((r) => {
        text += `🗓 ${r.date} | ⏰ ${r.start} - ${r.end} | ⌛ ${r.worktime}\n`;
      });

      // add total worktime
      const total = sumWorktimes(records);
      text += `\n🕒 مجموع ساعات کاری: ${total}`;

      // send to soheil
      await sendLoggedMessage(chatId, text);

      // send also to all managers
      // const managers = employees.filter((u) => u.role === "manager");
      // for (const m of managers) {
      //   if (m.telegramId) {
      //     await sendLoggedMessage(m.telegramId, text);
      //   }
      // }

      const tasks = await getDoneTasksByUser(emp.id, month);

      if (tasks.length) {
        // build a single report object (PDF generator expects report.records and report.tasks)
        const reportObj = {
          id: emp.id,
          name: emp.name,
          records: records || [], // attendance records
          total: total || "", // total worktime
          tasks, // array from DB
        };

        // ensure reports dir exists
        const reportsDir = path.join(__dirname, "../../reports");
        if (!fs.existsSync(reportsDir))
          fs.mkdirSync(reportsDir, { recursive: true });

        // unique filename per employee to avoid overwriting
        const pdfPath = path.join(
          reportsDir,
          `tasks_${emp.id}_${month}_${Date.now()}.pdf`
        );

        // pass an array (even for single employee)
        await generatePdfFromPython([reportObj], month, pdfPath);
        // send PDF to soheil
        await bot.sendDocument(chatId, pdfPath);

        // send PDF also to managers
        // for (const m of managers) {
        //   if (m.telegramId) {
        //     await bot.sendDocument(m.telegramId, pdfPath);
        //   }
        // }
      } else {
        await sendLoggedMessage(
          chatId,
          `📝 هیچ تسکی برای ${emp.name} در ماه ${month} انجام نشده.`
        );
      }
    }
  },
};
