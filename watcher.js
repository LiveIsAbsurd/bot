const token = require("../watcher.js");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const bot = new TelegramBot(token, { polling: { interval: 1000 } });

let triggers = JSON.parse(fs.readFileSync("../file.json", "UTF-8"), null, 2);

bot.on("message", msg => {
  let text = msg.text.toLowerCase();
  let trigArr = Object.keys(triggers);

  trigArr.forEach(el => {
    if (text.some(el)) {
      let rnd = Math.floor(Math.random() * (triggers[el].length));
      bot.sendMessage(msg.chat.id, triggers[el][rnd], {reply_to_message_id: msg.message_id});
    }
  })
})

bot.onText(/\/addTrigger (.+)/, (msg, match) => {
  if (msg.from.id == "261749882" || msg.from.id == "300711096") {
    let trigger = match[1];
    let trigText = match.input.replace(match[0], "").replace("\n", "")

    if (!triggers[trigger]) {
      triggers[trigger] = [];
    }

    triggers[trigger].push(trigText);

    fs.writeFile("../file.json", JSON.stringify(triggers, null, 2), "utf-8", err => {
      bot.sendMessage(msg.chat.id, `Триггер: ${trigger} \nтекст: ${trigText}`);
    });
  }
})