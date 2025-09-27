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

async function getDoneTasksByUser(userid, month) {
  try {
    // Fetch all done tasks first
    const res = await db.query(
      `SELECT * FROM tasksbam
       WHERE userid = $1
         AND done = true
         AND donetime LIKE $2`,
      [userid, `${month}-%`]
    );

    const tasks = res.rows;

    if (tasks.length > 0) {
      // Delete the same tasks
      await db.query(
        `DELETE FROM tasksbam
         WHERE userid = $1
           AND done = true
           AND donetime LIKE $2`,
        [userid, `${month}-%`]
      );
    }

    return tasks;
  } catch (err) {
    console.error(`Error fetching and deleting done tasks for ${userid}`, err);
    return [];
  }
}

module.exports = { getAttendanceByUser, getDoneTasksByUser };
