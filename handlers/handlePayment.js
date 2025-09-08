const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { sendLoggedMessage } = require("../utils/logger");
const showEmployeeMenu = require("./menus/showEmployeeMenu");

function handlePaymentMessages(bot, msg, sessions, saveSessions) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const session = sessions[chatId];

  if (!session) return false; // Not in flow

  if (session.step === "ask_unit") {
    session.unit = text;
    session.step = "ask_discount";
    saveSessions(sessions);
    sendLoggedMessage(chatId, "💸 درصد تخفیف را وارد کنید (مثلاً 10):");
    return true;
  }

  if (session.step === "ask_discount") {
    session.discount = text;
    session.step = "ask_method";
    saveSessions(sessions);
    sendLoggedMessage(chatId, "💳 روش پرداخت را وارد کنید (1 یا 0.5):");
    return true;
  }

  if (session.step === "ask_method") {
    session.method = text;
    saveSessions(sessions);

    sendLoggedMessage(chatId, "⏳ در حال ساخت فایل PDF...");

    const scriptPath = path.join(__dirname, "..", "PythonScripts", "main.py");
    console.log("Running python script:", scriptPath);

    const dummyOutput = "ignored.pdf";
    const pythonBin = process.env.PY_BIN || "python3";

    const pyProcess = spawn(pythonBin, [
      scriptPath,
      "--unit",
      session.unit,
      "--discount",
      session.discount,
      "--payment",
      session.method,
      "--output",
      dummyOutput,
    ]);

    let stdoutData = "";
    let stderr = "";

    pyProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pyProcess.on("close", (code) => {
      // Always clear temporary payment fields
      session.unit = null;
      session.discount = null;
      session.method = null;

      if (code !== 0) {
        console.error("Python script error:", stderr);
        sendLoggedMessage(
          chatId,
          stderr.includes("Unit number") && stderr.includes("not found")
            ? "❌ واحد موجود نمیباشد."
            : "❌ خطا در ایجاد فایل پرداخت."
        );
        // Set step back to main so user can continue
        session.step = "main";
        saveSessions(sessions);
        if (session.username) showEmployeeMenu(chatId, session.username);
        return;
      }

      const rawOutputLines = stdoutData.trim().split("\n");
      const rawOutput = rawOutputLines[rawOutputLines.length - 1].trim();
      const finalPdfPath = path.resolve(rawOutput);

      if (!fs.existsSync(finalPdfPath)) {
        sendLoggedMessage(chatId, "❌ فایل ساخته شده پیدا نشد.");
        // Set step to main to continue
        session.step = "main";
        saveSessions(sessions);
        if (session.username) showEmployeeMenu(chatId, session.username);
        return;
      }

      const fileStream = fs.createReadStream(finalPdfPath);
      bot
        .sendDocument(chatId, fileStream)
        .then(() => {
          console.log("File sent successfully.");
          sendLoggedMessage(chatId, "✅ فایل پرداخت آماده شد و ارسال شد.");

          // Set step to main after success
          session.step = "main";
          saveSessions(sessions);

          if (session.username) showEmployeeMenu(chatId, session.username);

          try {
            fs.unlinkSync(finalPdfPath);
          } catch (e) {
            console.error("Error deleting file:", e);
          }
        })
        .catch((err) => {
          console.error("Error sending document:", err);
          sendLoggedMessage(chatId, "❌ خطا در ارسال فایل PDF.");

          // Still set step to main
          session.step = "main";
          saveSessions(sessions);
          if (session.username) showEmployeeMenu(chatId, session.username);
        });
    });

    return true;
  }

  return false;
}

module.exports = handlePaymentMessages;
