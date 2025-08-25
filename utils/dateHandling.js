const moment = require('moment-jalaali');
require('moment-timezone');


function getTodayPersianDate() {
    const now = moment().tz('Asia/Tehran');
    const persianDate = now.format('jMM-jDD');   
    return persianDate
}

module.exports = {getTodayPersianDate}