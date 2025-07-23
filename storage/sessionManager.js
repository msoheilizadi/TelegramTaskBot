const fs = require('fs');
const path = require('path');
const sessionsFile = path.join(__dirname, '..', 'sessions.json');

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

module.exports = { loadSessions, saveSessions };
