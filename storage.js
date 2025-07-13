const fs = require('fs');
const path = './data.json';

function readData() {
  if (!fs.existsSync(path)) return { users: {} };
  const raw = fs.readFileSync(path);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getUser(username) {
  const data = readData();
  return data.users[username] || null;
}

function updateUser(username, newUserData) {
  const data = readData();
  data.users[username] = newUserData;
  writeData(data);
}

function getAllUsers() {
  const data = readData();
  return data.users;
}

function getChatIdByPhone(phone) {
  const data = readData();
  return data.phoneMap?.[phone] || null;
}

function getUserByPhone(phone) {
  const chatId = getChatIdByPhone(phone);
  if (!chatId) return null;

  // if you store full user objects keyed by phone:
  return data.users[phone];
}

module.exports = { readData, writeData, getUser, updateUser, getAllUsers, getChatIdByPhone, getUserByPhone };
