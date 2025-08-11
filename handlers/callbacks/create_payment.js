const { exec } = require("child_process");
const fs = require("fs");

function handlePaymentFlow(bot, query, sessions, saveSessions) {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "create_payment") {
    sessions[chatId] = { step: "ask_unit" };
    saveSessions(sessions);
    bot.sendMessage(chatId, "📦 شماره واحد را وارد کنید:");
    return true;
  }

  return false;
}

module.exports = handlePaymentFlow;
