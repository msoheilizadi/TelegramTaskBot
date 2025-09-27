const handleLoginSteps = require('./handleLoginSteps');
const handleTaskEdit = require('./handleTaskEdit');
const handleTaskAdd = require('./handleTaskAdd');
const handleAssignTask = require('./handleAssignTask');
const {sendLoggedMessage} = require('../utils/logger');
const storage = require('../storage');
const handleRequestLeave = require('./handleRequestLeave');
const handlePaymentMessages = require("./handlePayment");


module.exports = async function handleMessage(bot, msg, sessions, saveSessions) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/') || !sessions[chatId]) return;

  const session = sessions[chatId];

  // Handle Task Editing
  if (session.editingTask) {
    await handleTaskEdit(chatId, text, session, sessions, saveSessions);
    return;
  }

  
  // ——— Leave request flow ———
  if (handleRequestLeave(bot, chatId, text, session, sessions, saveSessions)) {
    return;
  }
  

  // Handle Task Add
  if (session.addingTask) {
    await handleTaskAdd(chatId, text, session, sessions, saveSessions);
    return;
  }

  // Handle Assigning Task
  if (session.addingForOther || session.assignTo) {
    await handleAssignTask(chatId, text, session, sessions, saveSessions);
    return;
  }
  if (handlePaymentMessages(bot, msg, sessions, saveSessions)) return;

  // Handle Login Steps
  if (session.step) {
    await handleLoginSteps(bot, msg, chatId, text, session, sessions, saveSessions);
    return;
  }
};
