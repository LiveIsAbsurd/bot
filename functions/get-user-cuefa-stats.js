const fs = require("fs");


function getUserCuefaStats(bot, user, msg) {
    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
      let stats = JSON.parse(data);
  
      if (Object.keys(stats).includes(user)) {
  
        bot.sendMessage(msg.chat.id,
          `Игрок @${stats[user].name}
Число игр: ${stats[user].total}
Победы: ${stats[user].win}
Поражения: ${stats[user].lose}
Ничья: ${stats[user].total - (stats[user].win + stats[user].lose)}
Винрейт(без ничьих): ${isNaN(((stats[user].win / (stats[user].win + stats[user].lose)) * 100).toFixed(2)) ? 0 : ((stats[user].win / (stats[user].win + stats[user].lose)) * 100).toFixed(2)}%`);
    
      } else {
        bot.sendMessage(msg.chat.id,
          `Статистика отсутствует`);
      }
    });
  };

export default getUserCuefaStats;