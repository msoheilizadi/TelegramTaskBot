const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { sendLoggedMessage } = require("../utils/logger");
const showEmployeeMenu = require("./menus/showEmployeeMenu");
const { getAedRate } = require("../Api/getAedRate");

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

      // PDF path
      const pdfLine = rawOutputLines.find((line) => line.endsWith(".pdf"));
      const finalPdfPath = pdfLine ? path.resolve(pdfLine.trim()) : null;

      // AED price
      const priceLine = rawOutputLines.find((line) =>
        line.startsWith("AED_PRICE=")
      );
      const aedPrice = priceLine ? parseFloat(priceLine.split("=")[1]) : null;

      console.log("Extracted AED Price:", aedPrice);
      console.log("Final PDF Path:", finalPdfPath);

      if (!fs.existsSync(finalPdfPath)) {
        sendLoggedMessage(chatId, "❌ فایل ساخته شده پیدا نشد.");
        session.step = "main";
        saveSessions(sessions);
        if (session.username) showEmployeeMenu(chatId, session.username);
        return;
      }

      const discountPct = parseFloat(session.discount);
      const methodPct = parseFloat(session.method); // 1 or 0.5

      // Calculations (all rounded)
      const totalPriceBeforeDiscount = Math.round(
        aedPrice / (1 - discountPct / 100)
      );
      const discountAmount = totalPriceBeforeDiscount - aedPrice;
      const downPaymentPercent = methodPct === 0.5 ? 0.3 : 0.2;
      const downPayment = Math.round(aedPrice * downPaymentPercent);

      const monthlyPayment = Math.round(aedPrice * (methodPct / 100));

      const rate = getAedRate(); // AED to IRR
      const totalPriceBeforeDiscountToman = Math.round(
        totalPriceBeforeDiscount * rate
      );
      const aedPriceToman = Math.round(aedPrice * rate);
      const downPaymentToman = Math.round(downPayment * rate);
      const monthlyPaymentToman = Math.round(monthlyPayment * rate);
      const discountAmountToman = Math.round(discountAmount * rate);

      // Summary text with emojis
      const summaryText = `
🏢 واحد: ${session.unit}
💸 تخفیف: ${discountPct}%
💳 روش پرداخت: ${methodPct * 100}%

💰 مبلغ کل به درهم: ${totalPriceBeforeDiscount} AED (~${totalPriceBeforeDiscountToman} تومان)
💵 مبلغ کل بعد از تخفیف: ${aedPrice} AED (~${aedPriceToman} تومان)
🪙 پیش پرداخت اولیه (${
        downPaymentPercent * 100
      }%): ${downPayment} AED (~${downPaymentToman} تومان)
📆 مبلغ پرداختی ماهانه: ${monthlyPayment} AED (~${monthlyPaymentToman} تومان)
🎁 میزان تخفیف اعمال شده: ${discountAmount} AED (~${discountAmountToman} تومان)
`.trim();

      // Send PDF and summary
      const fileStream = fs.createReadStream(finalPdfPath);
      bot
        .sendDocument(chatId, fileStream)
        .then(() => {
          sendLoggedMessage(chatId, "✅ فایل پرداخت آماده شد و ارسال شد.");
          sendLoggedMessage(chatId, summaryText);

          // Reset session AFTER sending
          session.unit = null;
          session.discount = null;
          session.method = null;
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
