const db = require("./connectToDb");

async function getAttendanceByUser(userid, month) {
  try {
    // Assuming your `date` column is stored as MM-DD (string)
    const res = await db.query(
      `SELECT id, userid, date, start, "end", worktime
       FROM clocksbam
       WHERE userid = $1
         AND SUBSTRING(date, 1, 2) = $2
       ORDER BY date ASC`,
      [userid, month]
    );
    return res.rows;
  } catch (error) {
    console.error(`❌ Failed to read attendance for user ${userid}:`, error);
    return [];
  }
}

module.exports = { getAttendanceByUser };
