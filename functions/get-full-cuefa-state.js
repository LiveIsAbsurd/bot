const token = require("../../token.js");

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token);

function getFullCuefaState(cb) {
    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
      let stats = JSON.parse(data);
      let fullState = Object.values(stats);
  
      fullState.sort((a, b) => {
        return b.win - a.win;
      });
  
//       let text = "";
//       let i = 1;
  
//       fullState.forEach(el => {
//         text += `${i}. ${el.name} - ${el.total} | ${el.win} | ${el.lose} | ${isNaN(((el.win / (el.win + el.lose)) * 100).toFixed(2)) ? 0 : ((el.win / (el.win + el.lose)) * 100).toFixed(2)}% \n`
//         i++;
//       })
  
//       bot.sendMessage(msg.chat.id,
//         `Статистика "камень, ножницы, бумага":
            
// # | Игры | Победы | Поражения | ВР(без ничьих)
  
// ${text}`);
      cb(fullState);
      
     });
  };

module.exports = getFullCuefaState;