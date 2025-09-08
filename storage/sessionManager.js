const fs = require('fs');
const path = require('path');
const sessionsFile = path.join(__dirname, '..', 'sessions.json');
const usersFile = path.join(__dirname, '../users.json');

const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

function loadSessions() {
  try {
    const data = fs.readFileSync(sessionsFile, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

// Now accept `sessionsObj` and write it back
function saveSessions(sessionsObj) {
  if (typeof sessionsObj !== 'object') {
    throw new Error('saveSessions() expects a sessions object');
  }
  fs.writeFileSync(sessionsFile, JSON.stringify(sessionsObj, null, 2), 'utf-8');
}

function getUserIdByName(name) {
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    return user ? user.id : null;
}

function getAllEmployees() {
  try {
    const filePath = path.join(__dirname, "..", "users.json");
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Error reading users.json:", err);
    return [];
  }
}

module.exports = { loadSessions, saveSessions, getUserIdByName , getAllEmployees };
