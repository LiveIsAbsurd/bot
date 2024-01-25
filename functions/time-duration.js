const moment = require('moment-timezone');

const timeDuration = (date) => {
  const realDate = new Date();
  const endDate = moment(realDate).tz('Europe/Moscow');

  const duration = moment.duration(endDate.diff(date));

  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  let result = '';
  if (years > 0) {
      result += `${years} гд `;
  }

  if (months > 0) {
    result += `${months} мес `;
  }

  if (days > 0 && years === 0) {
    result += `${days} дн `;
  }

  if (hours > 0 && months === 0 && years === 0) {
    result += `${hours} час `;
  }

  if (minutes > 0 && days === 0 && months === 0 && years === 0) {
    result += `${minutes} мин `;
  }

  if (seconds > 0 && hours === 0 && days === 0 && months === 0 && years === 0) {
    result += `${seconds} сек `;
  }

  return result;
};

module.exports = timeDuration;