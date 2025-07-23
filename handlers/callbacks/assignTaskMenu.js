const { sendLoggedMessage } = require('../../utils/logger');
const storage = require('../../storage');

module.exports = function assignTaskMenu(bot, query, sessions, saveSessions) {
  if (query.data !== 'assign_task') return false;

  const chatId = query.message.chat.id;
  const allUsers = storage.getAllUsers();
  const employeeButtons = Object.entries(allUsers)
    .filter(([_, u]) => u.role === 'employee')
    .map(([uname]) => [{ text: uname, callback_data: `assign_${uname}` }]);

  sendLoggedMessage(chatId, '👤 کارمند مورد نظر رو انتخاب کن:', {
    reply_markup: { inline_keyboard: employeeButtons }
  });

  return true;
};
