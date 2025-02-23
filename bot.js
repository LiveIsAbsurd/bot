const token = require("../token.js");
const weatherToken = require("../weatherToken.js");

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const { json } = require("body-parser");
const cron = require('node-cron');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const cuefaGame = require("./functions/cuefa-game.js");
const getUserCuefaStats = require("./functions/get-user-cuefa-stats.js");
const getFullCuefaState = require("./functions/get-full-cuefa-state.js");
const hiCount = require("./functions/hi-count.js");
const setChatState = require("./functions/set-chat-state.js");
const displayList = require("./functions/displayList.js")
const getChatState = require("./functions/get-chat-state.js");
const getChatAdmins = require("./functions/getChatAdmins.js");
const {xoGame, xoGameStart} = require("./functions/xoGame.js");
const getInfo = require("./functions/getInfo.js");
const createStaticMessage = require("./functions/createStaticMessage.js");
const wordsCounter = require('./functions/wordsCounter.js');

function hiText(username) {
  let text = `
  Добро пожаловать, ${username}! ⚡️

Данный чат является королевством мемов, метаиронии, абсурда и т.д. по списку...
Я, главный бот данного чата!

Желаю тебе побыстрее освоиться тут и попасть в топ участников /chatstate
либо порвать топ меморитетов чата /top 😏, но тут уже нужно постараться!

По команде /help узнаешь все мои команды.
Если есть вопросы, тегни моего создателя
@LiveIsAbsurd, 
главного дизайнера @yorigami, 
художника @TeaBateman 
или специалиста по вайбу (wibe) @Krasnaya_Kapusta!

Помни, что всё написанное в данном чате является шуткой, как и оскорбления, которые не несут цели кого-либо задеть или оскорбить :)`;
  return text;
}

function oldHiText(username, countMessage) {
  let text = `
  Добро пожаловать снова ${username}.

За всё время ты написал ${countMessage} сообщений!
Отправь /info для подробной статистики, /help для помощи по командам.`;
  return text;
}

const bot = new TelegramBot(token, { polling: { interval: 1000 } });

let chatState = JSON.parse(fs.readFileSync("../chatStats.json", "UTF-8"),null, 2);
let info = JSON.parse(fs.readFileSync("../info.json", "UTF-8"));
let wordsCount = JSON.parse(fs.readFileSync('../wordsCount.json', "UTF-8"),null, 2);
let staticMessage = info.staticMessageID;
let date = new Date();
let realDateGlobal = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
let editState = false;
let stateBool = true;
let fuckBool = true;
let messageCount = {};
let authorityTriggers = ['+', 'жиза', 'база', '👍', 'база.', 'жиза.', '5+']; //new
let usersSendAuthority = {}; //new
let adminList = [];
let currentPage = {};
let xoPlaceId = {};
const blockedUsers = [];
//Соит Чай

cron.schedule('0 7 * * *', () => {
  dailyHi();

  for (user in messageCount) {
    if (messageCount[user].level == 0) {
      return;
    } else {
      messageCount[user].level -= 1;
    }
  }
})

// bot.sendMessage(-1001807749316, 'Кирилл ебанарот удалил все мои сообщения!!!').then(msg => console.log(msg))

bot.editMessageText(`
Сообщений с 27.07.2023

+${chatState.messageOnDate[realDateGlobal] ?chatState.messageOnDate[realDateGlobal]?.totalMessage : 0} за сутки
`, {
  chat_id: "-1001807749316",
  message_id: staticMessage,
  reply_markup: {
    inline_keyboard: [[{ text: `${chatState.totalMessage}`, callback_data: "chatState" }]]
  }
});

getChatAdmins(token, adminList);

bot.onText(/\/createMessage/, async (msg) => {
  if (msg.from.id != '261749882') {
      return;
  }

  staticMessage = await createStaticMessage(bot, token, msg, chatState, realDateGlobal);
});

//крестики-нолики________________________________________________________


bot.onText(/\/xo/, msg => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  xoGameStart(msg, undefined, xoPlaceId, bot);
});

//крестики-нолики________________________________________________________

bot.on("message", (msg, match) => {
  if (msg.chat.id == "-1001807749316") {
    setChatState(msg, chatState);
    wordsCounter(msg, wordsCount);
    if (match.type === 'text' || match.type === 'sticker') {
      //rescrictUsers(msg);
      msg.sticker?.emoji == '👍' ? setAuthority(msg, chatState) : null;
    }
    if (match.type === 'text') {
      NewYear(msg);
      fuck(msg);
      authorityTriggers.some(el => msg.text.toLowerCase() === el) ? setAuthority(msg, chatState) : null;
    } //new
    // if (match.type === 'sticker') {
    //   authorityTriggers.some(el => msg.sticker.emoji === el) ? setAuthority(msg, chatState) : null;
    // }
    editState = true;
  }
  //trigger(msg);
});

bot.onText(/\/mute/, (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  muteUser(msg);
});

bot.onText(/\/help/, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  bot.sendMessage(msg.chat.id,
    `
Основные команды: 

/start - приветствие
/top - топ меморитетов чата
/chatstate - статистика чата
/kick - (в ответ на сообщение) удаление участника (только для админов)
/cuefa - камень, ножницы, бумага
/getcuefastats - цуефа статистика игрока
/getfullcuefastats - цуефа полная статистика
/xo - крестики-нолики
/memo - что такое меморитет?
/state - графики чата
/info - инфо о себе или участнике

Вопросы? Позови
@meme_house_admin :)
    `);
});

bot.onText(/\/chatstate/, msg => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  bot.deleteMessage(msg.chat.id, msg.message_id);
  getChatState(chatState, (message => {
    displayList(msg, null, message, 5, `
Статистика с 27.07.23
Всего сообщений: ${chatState.totalMessage}
Топ:`, "chatState", chatState, bot, currentPage)
  }));
});

bot.onText(/\/cuefa/, (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  if (msg.chat.id == "-1001807749316") {
    if (msg.from.username) {
      bot.deleteMessage(msg.chat.id, msg.message_id);
      cuefaGame(msg, null, false, true);
    } else {
      bot.sendMessage(
        msg.chat.id,
        `Для игры установи имя пользователя`
      );
    }
  } else {
    cuefaGame(msg);
  }
});

bot.onText(/\/getcuefastats/, msg => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  bot.deleteMessage(msg.chat.id, msg.message_id);
    if (msg.reply_to_message) {
      getUserCuefaStats(String(msg.reply_to_message.from.id), msg);
    } else if (msg.from.username) {
      getUserCuefaStats(String(msg.from.id), msg);
    }
});

bot.onText(/\/getfullcuefastats/, msg => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  bot.deleteMessage(msg.chat.id, msg.message_id);
    getFullCuefaState(message => {
      displayList(msg, null, message, 5, "# | Игры | Победы | Поражения | ВР(без ничьих)", "cuefa", undefined, bot, currentPage);
    });
});

bot.on("inline_query", (query) => {
  //console.log(query);
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

bot.onText(/\/getKey/, (msg) => {
  if (msg.from.username == "LiveIsAbsurd") {
    const opts = {
      reply_markup: {
        inline_keyboard: [[{ text: "Кнопка 0", callback_data: "key" }]],
      },
    };

    bot.sendMessage(msg.chat.id, "Тестовая кнопка", opts);
  }
});

bot.on("callback_query", (query) => {
  if (blockedUsers.includes(query.from.id.toString())) {
    return;
  };

  const messageId = query.message.message_id;

  if (query.data.includes('unlock')) {
    if (query.data.replace("unlock", "") == query.from.id) {
      const userId = Number(query.data.replace("unlock", ""));
      const chatId = query.message.chat.id;
      const options = {
        can_send_message: true,
        can_send_media_message: true,
        can_send_other_message: true,
        can_add_web_page_previews: true
      }
    
      bot.promoteChatMember(chatId, userId, options).then(() => {
        bot.deleteMessage(query.message.chat.id, query.message.message_id);
        bot.answerCallbackQuery(query.id, {
          text: "Спасибо! Ты можешь писать сообщения!",
          show_alert: true,
        });
      })
    } else {
      bot.answerCallbackQuery(query.id, {
        text: "Ты серьёзно? 0_0",
        show_alert: true,
      });
    }
  } 

  if (query.data.includes("xo")) {
    if (query.data == "xoReplay") {
      bot.answerCallbackQuery(query.id, {
        text: "Перезапуск 🔄",
      });
      xoGameStart(undefined, query, xoPlaceId, bot);
    } else {
      xoGame(query, xoPlaceId, bot);
    }
  }

  if (query.data == "key") {
    fs.readFile("../hiMembers.json", "UTF-8", (err, data) => {
      let counts = JSON.parse(data);

      const opts = {
        inline_keyboard: [
          [
            {
              text: `Кнопка ${
                counts[messageId] ? counts[messageId]["count"] : 1
              }`,
              callback_data: "key",
            },
          ],
        ],
      };

      hiCount(query, opts, counts);
    });
  } else if (query.data == "hi") {
    fs.readFile("../hiMembers.json", "UTF-8", (err, data) => {
      let counts = JSON.parse(data);

      const opts = {
        inline_keyboard: [
          [
            {
              text: `Привет! \u{1F44b}  (${
                counts[messageId] ? counts[messageId]["count"] : 1
              })`,
              callback_data: "hi",
            },
          ],
          [{text: "Наш сайт", url: "https://liveisabsurd.github.io/Meme_House/"}],
          [{text: "Правила и обязанности", url: "https://t.me/meme_house_chat/30544"}]
        ],
      };

      hiCount(query, opts, counts, query.from.id);
    });
  }

  //-----------------------------------------------------------------------------------------------------------

  if (query.data == "rock" || query.data == "nosh" || query.data == "paper") {
    //console.log(query);
    if (query.from.username) {
      if (query.message.chat.id == "-1001807749316") {
        cuefaGame(null, query, false, true);
      } else {
        cuefaGame(null, query, false);
      }
    } else {
      bot.answerCallbackQuery(query.id, {
        text: "Для игры установи @username (имя пользователя)",
        show_alert: true,
      });
    }
  }

  if (query.data == "cuefaReplay") {
    if (query.from.username) {
      cuefaGame(null, query, true, true);
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

  if (query.data == "prev-cuefa") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] -= 1;
      getFullCuefaState(message => {
        displayList(null, query, message, 5, "# | Игры | Победы | Поражения | ВР(без ничьих)", "cuefa", undefined, bot, currentPage);
      })
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }

  if (query.data == "next-cuefa") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] += 1;
      getFullCuefaState(message => {
        displayList(null, query, message, 5, "# | Игры | Победы | Поражения | ВР(без ничьих)", "cuefa", undefined, bot, currentPage);
      })
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }

  if (query.data == "prev-chatState") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] -= 1;
    getChatState(chatState, (message => {
      displayList(null, query, message, 5, `
Статистика с 27.07.23
Всего сообщений: ${chatState.totalMessage}
Топ:`, "chatState", chatState, bot, currentPage)
    }));
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }

  if (query.data == "next-chatState") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] += 1;
    getChatState(chatState, (message => {
      displayList(null, query, message, 5, `
Статистика с 27.07.23
Всего сообщений: ${chatState.totalMessage}
Топ:`, "chatState", chatState, bot, currentPage)
    }));
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }

  if (query.data == "chatState") {
    if (!stateBool) {
      bot.answerCallbackQuery(query.id, {
        text: "Таймаут",
      });
      return;
    };

    getChatState(chatState, (message => {
      displayList(null, query, message, 5, `
Статистика с 27.07.23
Всего сообщений: ${chatState.totalMessage}
Топ:`, "chatState", chatState, bot, currentPage)
      setTimeout(() => {
        stateBool = true;
      }, 60000);
    }));
    stateBool = false;
  }

  if (query.data == "next-authority") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] += 1;
      getAuthority(chatState, (message) => {
        displayList(null, query, message, 5, 'Топ меморитетов чата:', 'authority', undefined, bot, currentPage);
      });
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  } //new

  if (query.data == "prev-authority") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] -= 1;
      getAuthority(chatState, (message) => {
        displayList(null, query, message, 5, 'Топ меморитетов чата:', 'authority', undefined, bot, currentPage);
      });
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }//new
});

bot.onText(/\/kick/, (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  const chatId = msg.chat.id;
  const userId = msg.reply_to_message.from.id;

  if (chatId == "-1001807749316") {
      if (adminList.includes(msg.from.id)) {
        axios
          .get(
            `https://api.telegram.org/bot${token}/kickChatMember?chat_id=${chatId}&user_id=${userId}`
          )
          .then(() => {
            bot.sendMessage(chatId, "Участник исключен из чата", {reply_to_message_id: msg.message_id});
            bot.deleteMessage(msg.chat.id, msg.reply_to_message.message_id);
          })
          .catch((error) => {
            console.log(error);
            bot.sendMessage(
              chatId,
              "Произошла ошибка при исключении участника",
              {reply_to_message_id: msg.message_id}
            );
          });
      } else {
        bot.sendMessage(chatId, "Ты кто такой, чтобы такое делать?", {reply_to_message_id: msg.message_id});
      }
  };
});

bot.on("new_chat_members", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.new_chat_member.id;
  const userName = msg.new_chat_member.username
    ? `@${msg.new_chat_member.username}`
    : msg.new_chat_member.first_name;
  const options = {
    can_send_message: false
  };

  if (chatId == "-1001807749316") {
    let userList = Object.keys(chatState.userMessage);
    console.log(userList.includes(String(userId)));
    
    const opts = {
      reply_markup: {
        inline_keyboard: [
        [{ text: "Привет! \u{1F44b}", callback_data: "hi" }], 
        [{text: "Наш сайт", url: "https://liveisabsurd.github.io/Meme_House/"}],
        [{text: "Правила (обязательно к прочтению!)", url: "https://telegra.ph/Osnovnye-pravila-CHATA-Meme-House-dom-meme-haus-dom-10-04"}]
      ],
      },
    };

    if (userList.includes(String(userId)) && chatState.userMessage[userId].count > 1) {
      let messCount = chatState.userMessage[userId].count;
      bot.sendMessage(chatId, oldHiText(userName, messCount));
    } else {
      bot.sendMessage(chatId, hiText(userName), opts);
    }
    
    // if (userId === msg.from.id) {
    //   bot.restrictChatMember(chatId, userId, options).then(() => {
    //     bot.sendMessage(chatId, "Извини, мне нужно проверить что ты не бот, чтобы писать сообщения нажми на кнопочку с сердечком. Если не получается, напиши @liveisabsurd", {
    //       reply_markup: {
    //         inline_keyboard: [[{ text: "🐮", callback_data: "unlock" }, { text: "❤️", callback_data: `unlock${userId}` }, { text: "🍎", callback_data: "unlock" }]],
    //       },
    //     });
    //   })
    // }
  }
});

bot.on("left_chat_member", (msg) => {
  const userName = msg.left_chat_member.username;
  const chatId = msg.chat.id;

  if (chatId == "-1001807749316") {
    bot.sendMessage(
      chatId,
      `Пользователь @${userName} покинул нас.
    Ну чтож... естественный отбор`
    );
  }
});

bot.onText(/\/start/, (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `Привет! Это оффициальный бот лучшего в телеграме чата https://t.me/meme_house_chat.
Присоединяйся!
Заходи на наш сайт https://liveisabsurd.github.io/Meme_House/`
  );
});

bot.onText(/\/setAdDescription (.+)/, (msg, match) => {
  const userAdmin = match[1].replace("@", "");
  const text = match.input.split("\n")[1];

  let adminList = [];

  if (msg.from.username == "LiveIsAbsurd") {
    axios
      .get(
        `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`
      )
      .then((response) => {
        let UsernameToId = {};

        response.data.result.forEach((admin) => {
          const username = admin.user.username;
          adminList.push(username.toLowerCase());
          UsernameToId[username] = admin.user.id;
        });

        let isAdmin = Number(adminList.indexOf(userAdmin.toLowerCase()));

        if (isAdmin >= 0) {
          fs.readFile("../adminDescriptions.json", "UTF-8", (err, data) => {
            let adminDesc = JSON.parse(data);
            adminDesc[UsernameToId[userAdmin.toLowerCase()]] = text;

            fs.writeFile(
              "../adminDescriptions.json",
              JSON.stringify(adminDesc),
              "UTF-8",
              (err) => {
                console.log(err);
              }
            );
            bot.sendMessage(
              msg.chat.id,
              `Описание @${userAdmin} изменено на: '${text}'`
            );
          });
        } else {
          bot.sendMessage(msg.chat.id, `@${userAdmin} не является админом`);
        }
      });
  } else {
    bot.sendMessage(msg.chat.id, `Я тебя не знаю`);
  }
});

bot.onText(/\/about (.+)/, (msg, match) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  const text = match[1];

  let username = msg.from.first_name;
  let userId = msg.from.id;
      
  fs.readFile("../adminDescriptions.json", "UTF-8", (err, data) => {
    let adminDesc = JSON.parse(data);
    adminDesc[userId] = text;

    fs.writeFile(
      "../adminDescriptions.json",
      JSON.stringify(adminDesc),
      "UTF-8",
      (err) => {
        console.log(err);
      }
    );
    bot.sendMessage(
      msg.chat.id,
      `${username}, твоё описание изменено на '${text}'`
    );
    bot.sendMessage(
      261749882,
      `${username} изменил описание на '${text}'`
    );
  });
});

setInterval(() => {
  date = new Date();
  realDateGlobal = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  if (editState) {
    fs.writeFile("../chatStats.json", JSON.stringify(chatState, null, 2), "UTF-8", (err) => {
      if (err) {
        console.log(err);
      }
      editState = false;
      console.log("Запись");
    });

    fs.writeFile("../wordsCount.json", JSON.stringify(wordsCount, null, 2), "UTF-8", (err) => {
      if (err) {
        console.log(err);
      }
    });

    bot.editMessageText(`
Сообщений с 27.07.2023

+${chatState.messageOnDate[realDateGlobal] ?chatState.messageOnDate[realDateGlobal]?.totalMessage : 0} за сутки
`, {
      chat_id: "-1001807749316",
      message_id: staticMessage,
      reply_markup: {
        inline_keyboard: [[{ text: `${chatState.totalMessage}`, callback_data: "chatState" }]]
      }
    });
  }
}, 15000);

process.on("SIGINT", async () => {
  await bot.editMessageText(`Бот временно отключён`, {
    chat_id: "-1001807749316",
    message_id: staticMessage
  });

  fs.writeFile("../chatStats.json", JSON.stringify(chatState, null, 2), "UTF-8", (err) => {
    if (err) {
      console.log(err);
    }
    console.log("Запись");
    process.exit(0);
  });

  fs.writeFile("../wordsCount.json", JSON.stringify(wordsCount, null, 2), "UTF-8", (err) => {
    if (err) {
      console.log(err);
    }
  });
})

//__________________________________

bot.onText(/\/send (.+)/, (msg, match) => {
  console.log(match[1]);
})

// function news(msg = null, reload = false) {
//   if (reload) {
//     axios.get('https://newsapi.org/v2/top-headlines?category=science&country=ru&pageSize=5&apiKey=08fb80b4c9104defafe8e7b1d1aa9f4f')
//       .then(data => { 
//         dayNews = data.data.articles;
//       })
//     return;
//   }

//   if (!msg) {
//     axios.get('https://newsapi.org/v2/top-headlines?category=science&country=ru&pageSize=5&apiKey=08fb80b4c9104defafe8e7b1d1aa9f4f')
//       .then(data => {
//         dayNews = data.data.articles;
//         let text = data.data.articles.map((el, i) => {
//           return `${i + 1}. ${el.title} /news_${i + 1} \n`
//         }).join("\n");
//         bot.sendMessage("-1001807749316", `
//     Всем доброго утра и хорошего настроения!

// Главные новости на сегодня:
      
// ${text}`);
//       })
//   } else {
//     let id = parseFloat(msg.text.replace("/news_", "").replace("@meme_house_bot", "")) - 1;

//     if (!isNaN(id)) {
      
//       bot.sendMessage(msg.chat.id, dayNews[id].url);
      
//     } else {

//     let text = dayNews.map((el, i) => {
//       return `${i + 1}. ${el.title} /news_${i + 1} \n`
//     }).join("\n");

//     bot.sendMessage(msg.chat.id, `${text}`);
    
//     }
//   }
// }
//котики---------------------------

bot.onText(/\/cat/, async (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  getCat(msg);
})

async function downloadImage(url) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
  })

  return response.data
}

const getCat = async (
  msg,
  caption = "Вот тебе рандомный котик!"
) => {
  let response = await axios.get('https://api.thecatapi.com/v1/images/search');
  downloadImage(response.data[0].url)
    .then((image) => {
      bot.sendPhoto(msg.chat.id, image, {caption: caption});
    })
};

//головоломка

const trigger = (msg) => {
  let trigA = false; //буква н
  let trigB = false; //буква п
  let trigC = 0; //две буквы д

  let text = msg.text.toLowerCase();
  console.log(text);

  text.split('').forEach(el => {

    if (el === 'н') {
      trigA = true;
    }

    if (el === 'п') {
      trigB = true;
    }

    if (el === 'д') {
      trigC ++;
    }
  });

  if (trigA && trigB && trigC >= 2) {
    bot.sendMessage(msg.chat.id, '🤔', {reply_to_message_id: msg.message_id});
  }
}

//ограничения

setInterval(() => {
  for (user in messageCount) {
    messageCount[user].count = 0;
  }
}, 5000);

const rescrictUsers = (msg) => {
  if (!messageCount[msg.from.id]) {
    messageCount[msg.from.id] = {
      count: 1,
      level: 0
    }
  } else {
    messageCount[msg.from.id].count += 1;
  }

  if (messageCount[msg.from.id].count >= 5) {
    messageCount[msg.from.id].count = 0;
    messageCount[msg.from.id].level += 1;

    if (messageCount[msg.from.id].level == 1) {
      bot.sendMessage(msg.chat.id, "Слишком много сообщений, предупреждение", {reply_to_message_id: msg.message_id});
    } else if (messageCount[msg.from.id].level == 2) {
      const untilDate = Math.floor(Date.now() / 1000) + 3600;
      bot.restrictChatMember(msg.chat.id, msg.from.id, {
        until_date: untilDate,
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false
      }).then(() => {
        bot.sendMessage(msg.chat.id, "Заглушен на 1 час", {reply_to_message_id: msg.message_id});
      }).catch((error) => {
        console.log(error);
      });
    } else if (messageCount[msg.from.id].level == 3) {
      const untilDate = Math.floor(Date.now() / 1000) + 21600;
      bot.restrictChatMember(msg.chat.id, msg.from.id, {
        until_date: untilDate,
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false
      }).then(() => {
        bot.sendMessage(msg.chat.id, "Заглушен на 6 часов", {reply_to_message_id: msg.message_id});
      }).catch((error) => {
        console.log(error);
      });
  } else if (messageCount[msg.from.id].level == 4) {
    const untilDate = Math.floor(Date.now() / 1000) + 43200;
    bot.restrictChatMember(msg.chat.id, msg.from.id, {
      until_date: untilDate,
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false
    }).then(() => {
      bot.sendMessage(msg.chat.id, "Заглушен на 12 часов", {reply_to_message_id: msg.message_id});
    }).catch((error) => {
      console.log(error);
    });
  };
 }
}

const muteUser = (msg) => {
  if (msg.chat.id != "-1001807749316") {
    return;
  };

  const user = msg.reply_to_message.from.id;
  const time = msg.text.replace('/mute', '').trim() ? msg.text.replace('/mute', '').trim() : 3600;
  const untilDate = Math.floor(Date.now() / 1000) + Number(time);

  if (adminList.includes(msg.from.id)) {
    bot.restrictChatMember(msg.chat.id, user, {
      until_date: untilDate,
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false
    }).then(() => {
      bot.sendMessage(msg.chat.id, `Участник заглушён на ${time} секунд`, { reply_to_message_id: msg.message_id });
    });
  } else {
    bot.restrictChatMember(msg.chat.id, msg.from.id, {
      until_date: untilDate,
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false
    }).then(() => {
      bot.sendMessage(msg.chat.id, `Участник заглушён на ${time} секунд`, { reply_to_message_id: msg.message_id });
    });
  }//
};

// ----------------------Авторитет

bot.onText(/\/top/, (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  getAuthority(chatState, (message) => {
    displayList(msg, null, message, 5, 'Топ меморитетов (/memo) чата:', 'authority', undefined, bot, currentPage);
  });
});

bot.onText(/\/memo/, (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  const message = `
Меморитет - главная характеристика мемехаусера!

Меморитет определяет "крутость" участника чата, получить его можно проявляя активность в чате и путём получения одобрений от других мемехаусеров ответом на его сообщения триггерами '+', 'база', 'жиза' и '👍'.

Только самые активные и пост/мета ироничные участники занимают верхние места в топе меморитета
/top`;

bot.sendMessage(msg.chat.id, message);
});

const setAuthority = (msg, state) => {
  const noReplay = !msg.reply_to_message;
  const isBot = msg.reply_to_message?.from.is_bot;
  const authMyself = msg.from.id === msg.reply_to_message?.from.id;

  let alreadySend = false;

  if (noReplay || isBot || authMyself) {
    return;
  }

  if (!state.userMessage[msg.reply_to_message.from.id]) {
    return;
  }
  //console.log(msg);

  if (!usersSendAuthority[msg.from.id]) {
    usersSendAuthority[msg.from.id] = [msg.reply_to_message.message_id];
  } else {
    usersSendAuthority[msg.from.id].includes(msg.reply_to_message.message_id)
      ? alreadySend = true
      : usersSendAuthority[msg.from.id].push(msg.reply_to_message.message_id);
  }

  if (alreadySend) {
    bot.sendMessage(msg.chat.id, 'Ты уже плюсовал это сообщение', {reply_to_message_id: msg.message_id});
    return;
  }

  !state.userMessage[msg.reply_to_message.from.id].authority 
    ? state.userMessage[msg.reply_to_message.from.id].authority = 1
    : state.userMessage[msg.reply_to_message.from.id].authority += 1

  const chatID = msg.chat.id;
  const messID = msg.reply_to_message.message_id;
  axios.get(`https://api.telegram.org/bot${token}/setmessagereaction?chat_id=${chatID}&message_id=${messID}&reaction=[{"type":"emoji", "emoji":"👍"}]`)
    .then((res) => {
        bot.sendMessage(msg.chat.id, `Меморитет ${state.userMessage[msg.reply_to_message.from.id].userFirstName} ${state.userMessage[msg.reply_to_message.from.id].authority} (+1) `, {reply_to_message_id: msg.message_id});
    });
};

const getAuthority = (state, cb) => {
  let userStats = Object.values(state.userMessage);

  let filterUserStats = userStats.filter(el => {
    return Boolean(el.authority);
  });
  
  filterUserStats.sort((a, b) => {
    return b.authority - a.authority;
  });
  
  cb(filterUserStats);
};

const nyTrigger = ['новым годом', 'наступающим', 'рождеством', 'наступившим', 'нового года', 'новом году', 'рождества', 'с праздником', 'новый год']

const NewYear = (msg) => {
  const chatID = msg.chat.id;
  const messID = msg.message_id;
  const text = msg.text.toLowerCase();
  const trigBoolen = nyTrigger.some(el => text.includes(el))
  
  if (trigBoolen) {
    axios.get(`https://api.telegram.org/bot${token}/setmessagereaction?chat_id=${chatID}&message_id=${messID}&reaction=[{"type":"emoji", "emoji":"🎄"}]`)
  }
}

const dailyHi = () => {
  axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=56.343703&lon=30.515671&appid=${weatherToken}&units=metric&lang=ru`)
    .then(response => {
      const date = new Date();
      const realHiDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      const dates = Object.keys(chatState.messageOnDate);
      const yestDate = realHiDate == dates[dates.length - 1] ? dates[dates.length - 2] : dates[dates.length - 1];
      const usersState = { ...chatState.messageOnDate[yestDate].userMessage }
      const users = Object.keys(usersState).map(key => [key, usersState[key]]);
      const sortUsers = users.sort((a, b) => {
        return b[1].count - a[1].count;
      });

      !chatState.userMessage[sortUsers[0][0]].authority
        ? chatState.userMessage[sortUsers[0][0]].authority = 1
        : chatState.userMessage[sortUsers[0][0]].authority += 1
      
      const message = `
Всем доброго утра и хорошего настроения!
  
По моим скромным данным в Великих луках сейчас ${response.data.weather[0].description}.
Температура воздуха ${Math.round(response.data.main.temp)}°C (по ощущениям ${Math.round(response.data.main.feels_like)}°C)

За вчерашний день было написано ${chatState.messageOnDate[yestDate].totalMessage} сообщений.

Самым активным участником вчера был 
${sortUsers[0][1].userName ? `@${sortUsers[0][1].userName}` : sortUsers[0][1].userFirstName}
(${sortUsers[0][1].count} сообщений),
его меморитет увеличен на 1.`;
      
      bot.sendMessage("-1001807749316", message, {reply_markup: {inline_keyboard: [[{  text: "Поддержать чат", url: "https://boosty.to/meme_house"  }]]}});
  })
  .catch(error => {
      console.error(error);
  });
};

const chartJsCanvas = new ChartJSNodeCanvas({width: 1000, height: 600});

bot.onText(/\/state/, async (msg) => {
  if (blockedUsers.includes(msg.from.id.toString())) {
    return;
  };

  let period = Number(msg.text.replace('/state ', ''));
  if (typeof period != 'number' || isNaN(period)) {
    period = 0;
  }
  const dates = Object.keys(chatState.messageOnDate);
  !!period ? dates.splice(0, dates.length - period) : null;
  const values = dates.map((date) => {
    return chatState.messageOnDate[date].totalMessage
  });

  const configuration = {
    type: 'bar',
    data: {
        labels: dates,
        datasets: [{
            label: `Количество сообщений за ${!!period ? period + ' суток' : 'всё время'}`,
            data: values,
            fill: true,
            backgroundColor: '#96188a',
        }]
    }
  };

  const image = await chartJsCanvas.renderToBuffer(configuration);
  bot.sendPhoto(msg.chat.id, image);
})

// bot.onText(/\/userstate/, async (msg) => {
//   const user = msg.reply_to_message ? msg.reply_to_message.from.id : msg.from.id;

//   let period = Number(msg.text.replace('/userState ', ''));
//   if (typeof period != 'number' || isNaN(period)) {
//     period = 0;
//   }
//   const dates = Object.keys(chatState.messageOnDate);
//   !!period ? dates.splice(0, dates.length - period) : null;
//   const values = dates.map((date) => {
//     return chatState.messageOnDate[date].userMessage[user] ? chatState.messageOnDate[date].userMessage[user].count : 0;
//   });

//   const configuration = {
//     type: 'line',
//     data: {
//         labels: dates,
//         datasets: [{
//             label: `Количество сообщений от ${chatState.userMessage[user].userFirstName} за ${!!period ? period + ' суток' : 'всё время'}`,
//             data: values,
//             fill: true,
//             borderColor: '#96188a',
//             tension: 0.3
//         }]
//     }
//   };

//   const image = await chartJsCanvas.renderToBuffer(configuration);
//   bot.sendPhoto(msg.chat.id, image);
// });

bot.onText(/\/info/, async (msg) => {
  const user = msg.reply_to_message ? msg.reply_to_message.from.id : msg.from.id;

  if (blockedUsers.includes(msg.from.id.toString()) || blockedUsers.includes(user.toString())) {
    return;
  };

  if (msg.reply_to_message?.from.is_bot) {
    return;
  }

  getInfo(msg, chatState, wordsCount, bot, chartJsCanvas, fs);
});

bot.onText(/\/reward/, msg => {
  // if (msg.from.id != '261749882') {
  //   return;
  // }

  if (!adminList.includes(msg.from.id) || blockedUsers.includes(msg.from.id.toString())) {
    return;
  }

  const user = msg.reply_to_message.from.id;
  const rewardName = msg.text.replace('/reward ', '');
  const rewardDate = new Date();

  if (!chatState.userMessage[user].rewards) {
    chatState.userMessage[user].rewards = [{name: rewardName, date: rewardDate}];
  } else {
    chatState.userMessage[user].rewards.push({name: rewardName, date: rewardDate});
  };

  bot.sendMessage(msg.chat.id, `${msg.reply_to_message.from.first_name} получил награду ${rewardName}`);
});

const fuckTrigger = ['умри', 'сука', 'сдохни', 'иди нахуй', 'умрёшь', 'умрешь', 'сгниешь', 'сгниёшь', 'нахуй иди', 'долбаеб', 'шлюха', 'уебок', 'уёбок', 'еблан', 'блядота', 'пидор', 'пидорас', 'пошел нахуй', 'пошёл нахуй'];

const fuck = (msg) => {

  if (!fuckBool) {
    return;
  }

  const chatID = msg.chat.id;
  const messID = msg.message_id;
  const text = msg.text.toLowerCase();
  const trigBoolen = fuckTrigger.some(el => text.includes(el))
  
  if (trigBoolen) {
    const random = Math.floor(Math.random() * 1000000000000);
    axios.get(`https://evilinsult.com/generate_insult.php?lang=ru&type=json&_=${random}`)
    .then(async (response) => {

      let responsePhoto = await axios.get('https://api.thecatapi.com/v1/images/search');

      downloadImage(responsePhoto.data[0].url)
      .then((image) => {
        bot.sendPhoto(msg.chat.id, image, {caption: response.data.insult, reply_to_message_id: messID});
      })
    })

    fuckBool = false;

    setTimeout(() => {
      fuckBool = true;
    }, 600000);
  }
}

// bot.onText(/\/fuck/, msg => {
//   if (msg.chat.id == "-1001807749316") {
//     const random = Math.floor(Math.random() * 1000000000000);
//     axios.get(`https://evilinsult.com/generate_insult.php?lang=ru&type=json&_=${random}`)
//     .then(response => {
//       bot.sendMessage(msg.chat.id, response.data.insult, {reply_to_message_id: msg.message_id});
//     })
//   }
// })