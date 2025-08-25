const fs = require("fs");
const { readTaskFromDb } = require("./storage/db/addTasksToDb");
const path = "./data.json";
const usersPath = "./user.json";

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

async function syncTasks() {
  const data = readData();
  const tasks = await readTaskFromDb();

  // Load user mapping (userid -> username)
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  } catch (err) {
    console.error("❌ Failed to read user.json:", err);
    return;
  }
  const idToName = Object.fromEntries(users.map((u) => [u.id, u.name]));

  // Reset tasks for all mapped users
  for (const username of Object.values(idToName)) {
    if (data.users[username]) {
      data.users[username].tasks = [];
    }
  }

  // Fill tasks fresh from DB result
  for (const { tasktitle, done, userid, id } of tasks) {
    const username = idToName[userid];
    if (!username || !data.users[username]) continue;

    if (!data.users[username].tasks) data.users[username].tasks = [];

    data.users[username].tasks.push({
      id: id || Date.now(), // use DB id if available
      title: tasktitle,
      completed: done,
    });
  }
}

module.exports = {
  readData,
  writeData,
  getUser,
  updateUser,
  getAllUsers,
  getChatIdByPhone,
  getUserByPhone,
  syncTasks
};
