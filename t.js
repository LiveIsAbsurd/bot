const token = "1313424342:AAG7gAuNIG5t_l7W40LU7GITL0G5Lftvwtc";

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const { json } = require("body-parser");

const bot = new TelegramBot(token, { polling: { interval: 1000 } });

bot.onText(/\/start/, msg => {
    bot.sendMessage(msg.chat.id, "Работает!");
});

bot.onText(/\/send (.+)/, (msg, match) => {
    console.log(match[1]);
})

bot.on("callback_query", query => {
    //console.log(query);
    if (query.data == "rock" || query.data == "nosh" || query.data == "paper") {
        if (query.from.username) {
          cuefaGame(null, query);
        } else {
          bot.answerCallbackQuery(query.id, {
            text: "Для игры установи @username (имя пользователя)",
            show_alert: true,
          });
        }
      }
    
      if (query.data == "cuefaReplay") {
        if (query.from.username) {
          cuefaGame(null, query, true);
          bot.answerCallbackQuery(query.id, {
            text: "Перезапуск 🔄",
          });
        } else {
          bot.answerCallbackQuery(query.id, {
            text: "Для игры установи @username (имя пользователя)",
            show_alert: true,
          });
        }
      }
})
  
bot.on("inline_query", (query) => {
  console.log(query.inline_message_id);
  //console.log(query.query == "/start");
  if (query.query == "/start") {
    const result = [
      {
        id: "1",
        type: "article",
        title: "Приветствие",
        input_message_content: {
          message_text: `Привет! Это оффициальный бот лучшего в телеграме чата https://t.me/meme_house_chat.
Присоединяйся!
Заходи на наш сайт https://liveisabsurd.github.io/Meme_House/`,
        }
      }
    ];

    bot.answerInlineQuery(query.id, result);

  }
});

let chatState = JSON.parse(fs.readFileSync("./chatStats.json", "UTF-8"));

bot.on("message", (msg) => {
  
  setChatState(msg, chatState);

});

function setChatState(msg, state) {
  console.log(msg);

  let userId = msg.from.id;
  let userName = msg.from.username ? msg.from.username : null;
  let userFirstName = msg.from.first_name;
  let date = new Date();
  let realDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDay()}`;

  state.totalMessage += 1;

  if (!state.userMessage[userId]) {
    state.userMessage[userId] = {
      userFirstName: userFirstName,
      userName: userName,
      count: 1,
    }
  } else {
    state.userMessage[userId].count += 1;

    if (state.userMessage[userId].userFirstName != userFirstName || state.userMessage[userId].userName != userName) {
      state.userMessage[userId].userFirstName = userFirstName;
      state.userMessage[userId].userName = userName;
    }
  }

  if (!state.messageOnDate[realDate]) {
    state.messageOnDate[realDate] = {
      totalMessage: 1,
      userMessage: {},
    }

    let userMessage = {
      userFirstName: userFirstName,
      userName: userName,
      count: 1,
    }

    state.messageOnDate[realDate].userMessage[userId] = userMessage;
  } else { //если текущая дата уже есть
    state.messageOnDate[realDate].totalMessage += 1;

    if (!state.messageOnDate[realDate].userMessage[userId]) {

      state.messageOnDate[realDate].userMessage[userId] = {
        userFirstName: userFirstName,
        userName: userName,
        count: 1,
      }
    } else { //если юзер уже писал в эту дату

      state.messageOnDate[realDate].userMessage[userId].count += 1;

      if (state.messageOnDate[realDate].userMessage[userId].userFirstName != userFirstName || state.messageOnDate[realDate].userMessage[userId].userName != userName) {
        state.messageOnDate[realDate].userMessage[userId].userFirstName = userFirstName;
        state.messageOnDate[realDate].userMessage[userId].userName = userName;
      }

    }
    
  }
}

process.on("SIGINT", () => {
  fs.writeFile("./chatStats.json", JSON.stringify(chatState), "UTF-8", (err) => {
    if (err) {
      console.log(err);
    }
    console.log("Запись");
    process.exit(0);
  });
})