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

      console.log(fullState);
  
      cb(fullState);
      
     });
  };

module.exports = getFullCuefaState;