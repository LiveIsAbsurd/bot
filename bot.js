const token = require("../token.js");

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const { json } = require("body-parser");

const cuefaGame = require("./functions/cuefa-game.js");
const getUserCuefaStats = require("./functions/get-user-cuefa-stats.js");
const getFullCuefaState = require("./functions/get-full-cuefa-state.js");
const hiCount = require("./functions/hi-count.js");
const setChatState = require("./functions/set-chat-state.js");
const createPaginationButtons = require("./functions/create-pagination-button.js");
let currentPage = {};
const getChatState = require("./functions/get-chat-state.js");

function hiText(username) {
  let text = `
  Доброго времени суток, ${username}!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Желаю освоиться в нашем чатике!
Заходи на наш сайт!
/help - основные команды бота.`;
  return text;
}

const bot = new TelegramBot(token, { polling: { interval: 1000 } });

let chatState = JSON.parse(fs.readFileSync("../chatStats.json", "UTF-8"),null, 2);
let editState = false;

bot.editMessageText(`Сообщений с 27.07.2023`, {
  chat_id: "-1001807749316",
  message_id: "59131",
  reply_markup: {
    inline_keyboard: [[{ text: `${chatState.totalMessage}`, callback_data: "chatState" }]]
  }
});

//крестики-нолики________________________________________________________
let xoPlace = {
  0: "◻️", 1: "◻️", 2: "◻️",
  3: "◻️", 4: "◻️", 5: "◻️",
  6: "◻️", 7: "◻️", 8: "◻️",
};

const winnComb = [[0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];

let xoPlaceId = {};

let xoKeys = {
  inline_keyboard: [
    [{ text: `${xoPlace[0]}`, callback_data: "xo0" }, { text: `${xoPlace[1]}`, callback_data: "xo1" }, { text: `${xoPlace[2]}`, callback_data: "xo2" }],
    [{ text: `${xoPlace[3]}`, callback_data: "xo3" }, { text: `${xoPlace[4]}`, callback_data: "xo4" }, { text: `${xoPlace[5]}`, callback_data: "xo5" }],
    [{ text: `${xoPlace[6]}`, callback_data: "xo6" }, { text: `${xoPlace[7]}`, callback_data: "xo7" }, { text: `${xoPlace[8]}`, callback_data: "xo8" }]
  ] 
}

bot.onText(/\/xo/, msg => {
  xoGameStart(msg);
});

//крестики-нолики________________________________________________________

bot.on("message", (msg) => {
  if (msg.chat.id == "-1001807749316") {
    setChatState(msg, chatState);
    editState = true;
  }
});

bot.onText(/\/help/, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  bot.sendMessage(msg.chat.id,
    `
Основные команды: 
/start - приветствие
/chatstate - статистика чата
/kick - (в ответ на сообщение) удаление участника (только для админов)
/cuefa - камень, ножницы, бумага
/getcuefastats - цуефа статистика игрока
/getfullcuefastats - цуефа полная статистика
    `, {reply_to_message_id: msg.message_id});
});

bot.onText(/\/chatstate/, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  getChatState(chatState, (message => {
    displayList(msg, null, message, 5, `
Статистика с 27.07.23
Всего сообщений: ${chatState.totalMessage}
Топ:`, "chatState", chatState)
  }));
});

bot.onText(/\/cuefa/, (msg) => {
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
  bot.deleteMessage(msg.chat.id, msg.message_id);
    if (msg.reply_to_message) {
      getUserCuefaStats(String(msg.reply_to_message.from.id), msg);
    } else if (msg.from.username) {
      getUserCuefaStats(String(msg.from.id), msg);
    }
});

bot.onText(/\/getfullcuefastats/, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
    getFullCuefaState(message => {
      displayList(msg, null, message, 5, "# | Игры | Победы | Поражения | ВР(без ничьих)", "cuefa");
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
  const messageId = query.message.message_id;

  if (query.data.includes("xo")) {
    if (query.data == "xoReplay") {
      bot.answerCallbackQuery(query.id, {
        text: "Перезапуск 🔄",
      });
      xoGameStart(undefined, query);
    } else {
      xoGame(query);
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
        displayList(null, query, message, 5, "# | Игры | Победы | Поражения | ВР(без ничьих)", "cuefa");
      })
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }

  if (query.data == "next-cuefa") {
    if (currentPage[query.message.message_id]) {
      currentPage[query.message.message_id] += 1;
      getFullCuefaState(message => {
        displayList(null, query, message, 5, "# | Игры | Победы | Поражения | ВР(без ничьих)", "cuefa");
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
Топ:`, "chatState", chatState)
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
Топ:`, "chatState", chatState)
    }));
    } else {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }

  if (query.data == "chatState") {
    getChatState(chatState, (message => {
      displayList(null, query, message, 5, `
Статистика с 27.07.23
Всего сообщений: ${chatState.totalMessage}
Топ:`, "chatState", chatState)
    }));
  }
});

bot.onText(/\/kick/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.reply_to_message.from.id;
  let adminList = [];

  if (chatId == "-1001807749316") {
    axios
      .get(
        `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`
      )
      .then((response) => {
        response.data.result.forEach((admin) => {
          if (admin.can_restrict_members || admin.status == "creator") {
            const username = admin.user.username;
            adminList.push(username.toLowerCase());
          }
        });

        let isAdmin = Number(
          adminList.indexOf(msg.from.username.toLowerCase())
        );

        if (isAdmin >= 0) {
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
      });
  } else {
    bot.sendMessage(
      261749882,
      `@${msg.from.username} использовал /kick в другом чате'`
    );
  }
});

bot.on("new_chat_members", (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.new_chat_member.username
    ? `@${msg.new_chat_member.username}`
    : msg.new_chat_member.first_name;

  if (chatId == "-1001807749316") {
    const opts = {
      reply_markup: {
        inline_keyboard: [
        [{ text: "Привет! \u{1F44b}", callback_data: "hi" }], 
        [{text: "Наш сайт", url: "https://liveisabsurd.github.io/Meme_House/"}],
        [{text: "Правила и обязанности", url: "https://t.me/meme_house_chat/30544"}]
      ],
      },
    };

    bot.sendMessage(chatId, hiText(userName), opts);
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

bot.onText(/\/setDescription (.+)/, (msg, match) => {
  const text = match[1];
  let adminList = [];

  axios
    .get(
      `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`
    )
    .then((response) => {
      response.data.result.forEach((admin) => {
        const username = admin.user.username;
        adminList.push(username.toLowerCase());
      });

      let username = msg.from.username;
      let userId = msg.from.id;
      let isAdmin = Number(adminList.indexOf(username.toLowerCase()));

      if (isAdmin >= 0) {
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
      } else {
        bot.sendMessage(msg.chat.id, `Ты не являешся админом чата`);
        bot.sendMessage(261749882, `${username} попытался сменить описание`);
      }
    });
});

setInterval(() => {
  if (editState) {
    fs.writeFile("../chatStats.json", JSON.stringify(chatState, null, 2), "UTF-8", (err) => {
      if (err) {
        console.log(err);
      }
      editState = false;
      console.log("Запись");
    });

    bot.editMessageText(`Сообщений с 27.07.2023`, {
      chat_id: "-1001807749316",
      message_id: "59131",
      reply_markup: {
        inline_keyboard: [[{ text: `${chatState.totalMessage}`, callback_data: "chatState" }]]
      }
    });
  }
}, 15000);

process.on("SIGINT", async () => {
  await bot.editMessageText(`Бот временно отключён`, {
    chat_id: "-1001807749316",
    message_id: "59131"
  });

  fs.writeFile("../chatStats.json", JSON.stringify(chatState, null, 2), "UTF-8", (err) => {
    if (err) {
      console.log(err);
    }
    console.log("Запись");
    process.exit(0);
  });
})

//__________________________________

function displayList(msg, query, array, usersPerPage, header, cbDop, state = undefined) {
  
  let start;
  if (!msg && query.data == "chatState") {
    start = 0;
  } else {
    start = query ? (currentPage[query.message.message_id] - 1) * usersPerPage : 0;
  }
  const end = start + usersPerPage;
  const page = array.slice(start, end);
  let message;

  if (cbDop == "cuefa") {
    message = page.map((el, index) => `${start + index + 1}. ${el.name} - ${el.total} | ${el.win} | ${el.lose} | ${isNaN(((el.win / (el.win + el.lose)) * 100).toFixed(2)) ? 0 : ((el.win / (el.win + el.lose)) * 100).toFixed(2)}%`).join('\n');
  }

  if (cbDop == "chatState") {
    const totalCount = state.totalMessage;
    message = page.map((el, index) => {
      let reward;
      let stateNum = start + index + 1;

      if (stateNum == 1) {
        reward = "🥇"
      } else if (stateNum == 2) {
        reward = "🥈"
      } else if (stateNum == 3) {
        reward = "🥉"
      }

      let text = `${reward ? "" : `${stateNum}.`}${reward ? reward : ""} ${el.userName ? el.userName : el.userFirstName} - ${el.count}/${Math.floor(el.count/totalCount*100)}%`;
      return text;
    }).join('\n');
  }

  let qq;
  if (!msg && query.data == "chatState") {
    qq = 1
  } else {
    qq = query ? currentPage[query.message.message_id] : 1;
  }

  let buttons = createPaginationButtons(array, qq, usersPerPage, cbDop);

  let keys = {
      reply_markup: {
          inline_keyboard: [buttons],
      }
  };

  if (msg || query.data === "chatState") {
      bot.sendMessage(msg ? msg.chat.id : query.message.chat.id, 
`
${header}

${message}
`, keys)
      .then(msg => {
          currentPage[msg.message_id] = 1;
      })
  } else if (query) {
      bot.editMessageText(
`
${header}

${message}
`, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          ...keys,
      })
  }
}

//крестики-нолики________________________________________________________
function xoGame(query) {
  let id = query.message.message_id;

  if (!xoPlaceId[id]) {
    bot.deleteMessage(query.message.chat.id, query.message.message_id);
    return;
  }
  
  if (xoPlaceId[id].player1.step == undefined && xoPlaceId[id].player1.id == query.from.id) {
    xoPlaceId[id].player1.step = xoPlaceId[id].step;
  }
  
  let playersId = {

    [xoPlaceId[id].player1.id]: {
      step: xoPlaceId[id].player1.step
    },

    [xoPlaceId[id].player2.id]: {
      step: xoPlaceId[id].player2.step
    }
  };

  if (xoPlaceId[id].player2.id == undefined && query.from.id != xoPlaceId[id].player1.id) {
    xoPlaceId[id].player2.id = query.from.id;
    xoPlaceId[id].player2.name = query.from.username ? query.from.username : query.from.first_name;
    xoPlaceId[id].player2.step = xoPlaceId[id].step;
    //console.log("Новый игрок!");
  } else if (query.from.id != xoPlaceId[id].player1.id && query.from.id != xoPlaceId[id].player2.id) {
    bot.answerCallbackQuery(query.id, {
      text: "Эта сессия не для тебя :( Создай новую!",
    });
    return;
  }

  if (xoPlaceId[id][query.data.replace("xo", "")] == "❌" || xoPlaceId[id][query.data.replace("xo", "")] == "⭕️") {
    bot.answerCallbackQuery(query.id, {
      text: "Клетка занята",
    });
    return;
  } else if (Object.keys(playersId).includes(String(query.from.id)) && playersId[query.from.id].step != xoPlaceId[id].step) {
    bot.answerCallbackQuery(query.id, {
      text: "Не твой ход",
    });
    return;
  } else if (xoPlaceId[id].step == "❌") {
    xoPlaceId[id][query.data.replace("xo", "")] = xoPlaceId[id].step;
    xoPlaceId[id].step = "⭕️";

    for (el in xoPlaceId[id]) {
      if ((el == "player1" || el == "player2") && xoPlaceId[id][el].id == query.from.id) {
        xoPlaceId[id][el].stepsArr.push(query.data.replace("xo", ""));
      }
    }
    //console.log(xoPlaceId[id]);
  } else {
    xoPlaceId[id][query.data.replace("xo", "")] = xoPlaceId[id].step;
    xoPlaceId[id].step = "❌";

    for (el in xoPlaceId[id]) {
      if ((el == "player1" || el == "player2") && xoPlaceId[id][el].id == query.from.id) {
        xoPlaceId[id][el].stepsArr.push(query.data.replace("xo", ""));
      }
    }
    //console.log(xoPlaceId[id]);
  }
 

  xoPlaceId[id].stepCount += 1;

  let winner;

  winnComb.forEach(comb => {
    let win1 = comb.every(el => {
      return xoPlaceId[id].player1.stepsArr.includes(String(el))
    });

    let win2 = comb.every(el => {
      return xoPlaceId[id].player2.stepsArr.includes(String(el))
    });

    if (win1) {
      winner = xoPlaceId[id].player1.name;
    } else if (win2) {
      winner = xoPlaceId[id].player2.name;
    }
  })

  if (winner) {
    xoGameStop(query, id, false, winner);
    return;
  }

  if (xoPlaceId[id].stepCount == 9) {
    xoGameStop(query, id, true);
    return;
  }

  keys = {
    inline_keyboard: [
      [{ text: `${xoPlaceId[id][0]}`, callback_data: "xo0" }, { text: `${xoPlaceId[id][1]}`, callback_data: "xo1" }, { text: `${xoPlaceId[id][2]}`, callback_data: "xo2" }],
      [{ text: `${xoPlaceId[id][3]}`, callback_data: "xo3" }, { text: `${xoPlaceId[id][4]}`, callback_data: "xo4" }, { text: `${xoPlaceId[id][5]}`, callback_data: "xo5" }],
      [{ text: `${xoPlaceId[id][6]}`, callback_data: "xo6" }, { text: `${xoPlaceId[id][7]}`, callback_data: "xo7" }, { text: `${xoPlaceId[id][8]}`, callback_data: "xo8" }]
    ] 
  }

  bot.editMessageText(
  `Крестики-нолики

${xoPlaceId[id].player1.name}${xoPlaceId[id].player1.step ? xoPlaceId[id].player1.step : ""} 
🆚
${xoPlaceId[id].player2.name ? `${xoPlaceId[id].player2.name}${xoPlaceId[id].player2.step ? xoPlaceId[id].player2.step : ""}` : "(Ожидание игрока)"}

Ходит ${xoPlaceId[id].step}`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: keys,
    }
  );
}

bot.onText(/\/send (.+)/, (msg, match) => {
    console.log(match[1]);
})

function xoGameStart(msg, query = undefined) {
  let name1;

  if (msg) {
    name1 = msg.from.username ? msg.from.username : msg.from.first_name;
  } else {
    name1 = query.from.username ? query.from.username : query.from.first_name;
  }

  let player1 = {
    id: query ? query.from.id : msg.from.id,
    name: name1,
    step: undefined,
    stepsArr: []
  }

  let player2 = {
    id: undefined,
    name: undefined,
    step: undefined,
    stepsArr: []
  }

  bot.sendMessage(query ? query.message.chat.id : msg.chat.id,
    `Крестики-нолики

${player1.name} 
🆚 
(Ожидание игрока)

Ходит ❌`,
    {
    reply_markup: {
      ...xoKeys
    }
  }).then(msg => {
    xoPlaceId[msg.message_id] = {
      ...xoPlace, stepCount: 0, step: "❌",
        player1: { ...player1 },
        player2: { ...player2 }
    };
  });
}

function xoGameStop(query, id, noWin, winner) {
  let place = "";
  Object.values(xoPlaceId[id]).forEach((el, i) => {
    if (i < 9) {
      if (i % 3 == 0 && i != 0) {
        place += `\n`
      }
      place += el;
    }
  });
  //console.log("Конец");
  bot.editMessageText(
    `Крестики-нолики

${xoPlaceId[id].player1.name}${xoPlaceId[id].player1.step ? xoPlaceId[id].player1.step : ""}
🆚
${xoPlaceId[id].player2.name}${xoPlaceId[id].player2.step ? xoPlaceId[id].player2.step : ""}

${noWin ? "Ничья 🤝" : `Победитель - ${winner} 🏆`}

${place}`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "xoReplay" }]]
        }
      }
  ).then(msg => {
    delete xoPlaceId[msg.message_id]
  });
}
//крестики-нолики________________________________________________________