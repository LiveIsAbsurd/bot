const token = require("../../token.js");

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token);

function getChatState(msg, state, cb) {
    let userStats = Object.values(state.userMessage);
    let text = "";
    let i = 1;
  
    userStats.sort((a, b) => {
      return b.count - a.count;
    });

    cb(userStats);
  
//     userStats.forEach(el => {
//       text += `${i}. ${el.userName ? el.userName : el.userFirstName} - ${el.count} \n`;
//       i++;
//     });
  
//     let message =
//       `Статистика с 27.07.23
// Всего сообщений: ${state.totalMessage}
  
// Топ:
  
// ${text}
//       `
    
//     bot.sendMessage(msg.chat.id, message);
}

module.exports = getChatState;