const db = require('./connectToDb');

function timeDifference(start, end) {
  // Parse "HH:MM"
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  // Convert to minutes
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Calculate difference
  let diff = endMinutes - startMinutes;

  // Handle case where end is past midnight
  if (diff < 0) diff += 24 * 60;

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}


async function addStartDayTime(userId, todayDate, startTime) {
    try {
        await db.query("INSERT INTO clocksbam (userid, date, start, end, worktime) VALUES ($1, $2, $3, $4, $5)", [userId, todayDate, startTime, "00:00", "00:00"]);
    }
    catch (err) {
        console.error(`faild to insert clock for userid: ${userId} startTime ${startTime} date ${todayDate}`);
        console.error(err);
    }
}

async function addEndDayTime(userId, todayDate, endTime) {
    let startTime;

    try {
        const response = await db.query(`SELECT * FROM clocksbam WHERE userid = $1 AND date = $2`, [userId, todayDate]);
        startTime = response.rows[0]["start"]; // Assuming pg returns rows array
    } catch (error) {
        console.error("Error fetching start time:", error);
        return;
    }

    const worktime = timeDifference(startTime, endTime);

    try {
        await db.query(
            'UPDATE clocksbam SET "end" = $1, worktime = $2 WHERE userid = $3 AND "date" = $4',
            [endTime, worktime, userId, todayDate]
        );
    } catch (error) {
        console.error("Error updating worktime:", error);
    }
}

async function addMoneyToUsers(userid, hours, balance) {
    try {
        const res = await db.query('SELECT * FROM alluserinfo WHERE userid = $1', [userid]);
        const user = res.rows[0];
        if (!user) {
            console.error(`User with ID ${userid} not found.`);
            return;
        }
        const addMoney = user.notpaid + Math.ceil((user.monthlysalary / user.thismonthtime) * hours);
        await db.query('UPDATE alluserinfo SET notpaid = $1, balancetime = $2 WHERE userid = $3', [addMoney, balance, userid]);
        return user.balancetime + balance;
    } catch (err) {
        console.log(`Error adding money for user ${userid}: balance: ${balance}, hours: ${hours}`, err);
        console.error(`Failed to add money for user ${userid}:`, err);
    }
}

async function removeDayOff(userid, hours) {
    
}

module.exports = {addStartDayTime, addEndDayTime, addMoneyToUsers}

