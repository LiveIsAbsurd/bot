const token = require("../../token.js");

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token);

function getUserCuefaStats(user, msg) {
    fs.readFile("../../cuefaStats.json", "UTF-8", (err, data) => {
      let stats = JSON.parse(data);
  
      if (Object.keys(stats).includes(user)) {
  
        bot.sendMessage(msg.chat.id,
          `Игрок @${stats[user].name}
Число игр: ${stats[user].total}
Побед: ${stats[user].win}
Поражений: ${stats[user].lose}
Винрейт: ${((stats[user].win / stats[user].total) * 100).toFixed(2)}%`);
    
      } else {
        bot.sendMessage(msg.chat.id,
          `Статистика отсутствует`);
      }
    });
  };

module.exports = getUserCuefaStats;