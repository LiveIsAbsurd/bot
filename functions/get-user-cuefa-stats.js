const token = require("../../token.js");

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token);

function getUserCuefaStats(user, msg) {
    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
      let stats = JSON.parse(data);
  
      if (Object.keys(stats).includes(user)) {
  
        bot.sendMessage(msg.chat.id,
          `Игрок @${stats[user].name}
Число игр: ${stats[user].total}
Победы: ${stats[user].win}
Поражения: ${stats[user].lose}
Ничья: ${stats[user].total - (stats[user].win - stats[user].lose)}
Винрейт(без нечьих): ${((stats[user].win / (stats[user].win + stats[user].lose)) * 100).toFixed(2)}%`);
    
      } else {
        bot.sendMessage(msg.chat.id,
          `Статистика отсутствует`);
      }
    });
  };

module.exports = getUserCuefaStats;