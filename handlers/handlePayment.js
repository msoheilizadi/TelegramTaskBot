const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function handlePaymentMessages(bot, msg, sessions, saveSessions) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const session = sessions[chatId];

  if (!session) return false; // Not in flow

  if (session.step === "ask_unit") {
    session.unit = text;
    session.step = "ask_discount";
    saveSessions(sessions);
    bot.sendMessage(chatId, "💸 درصد تخفیف را وارد کنید (مثلاً 10):");
    return true;
  }

  if (session.step === "ask_discount") {
    session.discount = text;
    session.step = "ask_method";
    saveSessions(sessions);
    bot.sendMessage(chatId, "💳 روش پرداخت را وارد کنید (1 یا 0.5):");
    return true;
  }

  if (session.step === "ask_method") {
    session.method = text;
    session.step = null;
    saveSessions(sessions);

    bot.sendMessage(chatId, "⏳ در حال ساخت فایل PDF...");

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
      if (code !== 0) {
        console.error("Python script error:", stderr);
        bot.sendMessage(chatId, "❌ خطا در ایجاد فایل پرداخت.");
        return;
      }

      const rawOutputLines = stdoutData.trim().split("\n");
      const rawOutput = rawOutputLines[rawOutputLines.length - 1].trim();

      if (rawOutput.toLowerCase().startsWith("error")) {
        console.error("Python script reported error:", rawOutput);
        bot.sendMessage(chatId, "❌ خطا در ایجاد فایل پرداخت: " + rawOutput);
        return;
      }

      const finalPdfPath = path.resolve(rawOutput);
      console.log("Sending file:", finalPdfPath);
      console.log("File exists:", fs.existsSync(finalPdfPath));

      if (!fs.existsSync(finalPdfPath)) {
        bot.sendMessage(chatId, "❌ فایل ساخته شده پیدا نشد.");
        return;
      }

      const fileStream = fs.createReadStream(finalPdfPath);
      bot
        .sendDocument(chatId, fileStream)
        .then(() => {
          console.log("File sent successfully.");
          try {
            fs.unlinkSync(finalPdfPath);
          } catch (e) {
            console.error("Error deleting file:", e);
          }
        })
        .catch((err) => {
          console.error("Error sending document:", err);
          bot.sendMessage(chatId, "❌ خطا در ارسال فایل PDF.");
        });
    });

    return true;
  }

  return false;
}

module.exports = handlePaymentMessages;
