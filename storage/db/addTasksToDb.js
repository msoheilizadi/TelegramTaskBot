const { Client } = require('pg'); 
require('dotenv').config();

const db = new Client({
    user:  process.env.DB_USER,
    host:  process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port:   process.env.DB_PORT
})

db.connect()
  .then(() => console.log("Connected to PostgreSQL!"))
  .catch(err => console.error("Connection error", err.stack));

async function addNewTask(userid, taskTitle, todayDate) {
    try {
        await db.query('INSERT INTO tasksbam (tasktitle, createtime, done, userid) VALUES ($1, $2, $3, $4)', [taskTitle, todayDate, false, userid])
    } catch (error) {
        console.error(`faild to add task ${taskTitle} for user ${userid} at ${todayDate}`)
        console.error(error);
    }
}

async function updateTask(userid, previousTaskTitle, newTaskTitle, todayDate) {
    try {
        await db.query(`UPDATE tasksbam SET tasktitle = $1, createtime = $2 WHERE userid = $3 AND tasktitle = $4`, [newTaskTitle, todayDate, userid, previousTaskTitle])        
    } catch (error) {
        console.error(`faild to edit task ${previousTaskTitle} to ${newTaskTitle} for ${userid} at ${todayDate}`)
    }
}

async function addCompletedUserTask(userid, completedTasks, todayDate) {
    try {
        for (let index = 0; index < completedTasks.length; index++) {
            const element = completedTasks[index].title;
            await db.query('UPDATE tasksbam SET donetime = $1, done = $2 WHERE userid = $3 AND tasktitle = $4', [todayDate, true, userid, element])
        }
    } catch (error) {
        console.error(error)
    }
}

async function readTaskFromDb() {
    try {
        const res = await db.query('SELECT id, tasktitle, userid, done FROM tasksbam');
        return res.rows
    } catch (error) {
        console.error("failed to read tasks from DB:", error);
        return []
    }
}

module.exports = { addCompletedUserTask, addNewTask, updateTask, readTaskFromDb }