const token = require("../token.js");

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");

const { json } = require("body-parser");
const { Console } = require("console");

function hiText(username) {
  let text = `
  Доброго времени суток, ${username}!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Все правила в закрепе.
Желаю освоиться в нашем чатике!
Заходи на сайт нашего чата: https://liveisabsurd.github.io/Meme_House/`;
  return text;
}

const bot = new TelegramBot(token, { polling: { interval: 1000 } });

//камень, ножницы, бумага________________________________________________
let cuefaPlayer1Id = {};
let cuefaPlayer2Id = {};
let cuefaPlayers = {};
let cuefaColl = {};
let cuefaToEmoji = {
  rock: "🤜",
  nosh: "✌️",
  paper: "✋",
};
const cuefaKeyboard = {
  inline_keyboard: [
    [
      { text: "🤜", callback_data: "rock" },
      { text: "✌️", callback_data: "nosh" },
      { text: "✋", callback_data: "paper" },
    ],
  ],
};

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
  if (msg.chat.id == "-1001807749316") {
    if (msg.reply_to_message) {
      getUserCuefaStats(String(msg.reply_to_message.from.id), msg);
    } else if (msg.from.username) {
      getUserCuefaStats(String(msg.from.id), msg);
    }
  }
});

bot.onText(/\/getfullcuefastats/, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  if (msg.chat.id == "-1001807749316") {
    getFullCuefaState(msg);
  }
});

function getUserCuefaStats(user, msg) {
  fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
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

function getFullCuefaState(msg) {
  fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
    let stats = JSON.parse(data);
    let fullState = Object.values(stats);

    fullState.sort((a, b) => {
      return b.win - a.win;
    });

    let text = "";
    let i = 1;

    fullState.forEach(el => {
      text += `${i}. ${el.name} - ${el.total} | ${el.win} | ${el.lose} \n`
      i++;
    })

    bot.sendMessage(msg.chat.id,
      `Статистика "камень, ножницы, бумага":
          
# | Игры | Победы | Поражения

${text}`);
  });
};

function setCuefaStats(winer, winerName, loser, loserName, noWin = false, getCuefaStats) {
  fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
    let stats = JSON.parse(data);

    if (!Object.keys(stats).includes(winer)) {
      if (!noWin) {
          stats[winer] = {
              total: 1,
              win: 1,
              lose: 0,
              vs: {},
          }

          stats[winer].name = winerName;
          stats[winer].vs[loser] = [1, 0, 0];
      } else {
          stats[winer] = {
              total: 1,
              win: 0,
              lose: 0,
              vs: {},
          }

          stats[winer].name = winerName;
          stats[winer].vs[loser] = [0, 0, 1];
      }
    } else {

      if (stats[winer].name != winerName) {
        stats[winer].name = winerName;
      }

      stats[winer].total += 1;

      if (!noWin) {
          stats[winer].win += 1;

          if(!Object.keys(stats[winer].vs).includes(loser)) {
              stats[winer].vs[loser] = [1, 0, 0]
          } else {
              stats[winer].vs[loser][0] += 1;
          }
      } else {
          if(!Object.keys(stats[winer].vs).includes(loser)) {
              stats[winer].vs[loser] = [0, 0, 1]
          } else {
              stats[winer].vs[loser][2] += 1;
          }
      }
    }

    if (!Object.keys(stats).includes(loser)) {
      if (!noWin) {
          stats[loser] = {
              total: 1,
              win: 0,
              lose: 1,
              vs: {},
          }

          stats[loser].name = loserName;
          stats[loser].vs[winer] = [0, 1, 0];
      } else {
          stats[loser] = {
              total: 1,
              win: 0,
              lose: 0,
              vs: {},
          }

          stats[loser].name = loserName;
          stats[loser].vs[winer] = [0, 0, 1];
      }
    } else {

      if (stats[loser].name != loserName) {
        stats[loser].name = loserName;
      }

      stats[loser].total += 1;

      if (!noWin) {
          stats[loser].lose += 1;

          if(!Object.keys(stats[loser].vs).includes(winer)) {
              stats[loser].vs[winer] = [0, 1, 0]
          } else {
              stats[loser].vs[winer][1] += 1;
          }
      } else {
          if(!Object.keys(stats[loser].vs).includes(winer)) {
              stats[loser].vs[winer] = [0, 0, 1]
          } else {
              stats[loser].vs[winer][2] += 1;
          }
      }
    }

    fs.writeFile("../cuefaStats.json", JSON.stringify(stats), "UTF-8", (err) => {
      if (err) {
        console.log(err);
      }

      getCuefaStats();
    });
  })
}

function cuefaGame(msg = null, query = null, replay = false, isMeme = false) {
  if (msg || replay) {
    const player1 = {};
    player1[replay ? query.from.username : msg.from.username] = { select: undefined };

    const player2 = {};
    if (replay) {
      player2["undefined"] = { select: undefined };
    } else {
      player2[msg.reply_to_message ? msg.reply_to_message.from.username : undefined] = { select: undefined };
    }

    const player1Name = Object.keys(player1)[0];
    const player2Name =
      Object.keys(player2)[0] != "undefined" ? `@${Object.keys(player2)[0]}` : "(Ожидание игрока...)";

    if (player1Name == player2Name.replace("@", "")) {
      bot.sendMessage(msg.chat.id, "Хочешь играть с самим собой?");
      return;
    }
    
    chatId = replay ? query.message.chat.id : msg.chat.id;

    bot.sendMessage(
        chatId,
        `Камень, ножницы, бумага
@${player1Name} 🆚 ${player2Name}
${isMeme ? "" : `Это ограниченная версия игры, полная версия в meme_house_chat.t.me`}`,
        { reply_markup: cuefaKeyboard }
      )
      .then((msg) => {
        cuefaColl[msg.message_id] = {};
        cuefaColl[msg.message_id].steps = {
          player1Step: false,
          player2Step: false,
        };
        cuefaColl[msg.message_id]["player1"] = player1;
        cuefaColl[msg.message_id]["player2"] = player2;
        cuefaPlayers[msg.message_id] = [
          Object.keys(cuefaColl[msg.message_id].player1)[0],
          Object.keys(cuefaColl[msg.message_id].player2)[0],
        ];
      });
  } else if (query && !replay) {

    if (!cuefaColl[query.message.message_id]) {
      bot.editMessageText(
        "Время вышло!",
        {
          chat_id: query.message.chat.id,
          message_id:query.message.message_id
        }
      );
      return;
    }

    const player2Name =
      cuefaPlayers[query.message.message_id][1] != "undefined" ? `@${cuefaPlayers[query.message.message_id][1]}` : "(Ожидание игрока...)";

    if (cuefaPlayers[query.message.message_id][0] == query.from.username) {
      if (!cuefaColl[query.message.message_id].steps.player1Step && cuefaPlayers[query.message.message_id].includes(query.from.username)) {
        cuefaColl[query.message.message_id].player1[query.from.username].select = cuefaToEmoji[query.data];
        cuefaColl[query.message.message_id].steps.player1Step = true;
        cuefaPlayer1Id[query.message.message_id] = query.from.id;

        if (!cuefaColl[query.message.message_id].steps.player2Step) {
          bot.editMessageText(
            `Камень, ножницы, бумага
@${cuefaPlayers[query.message.message_id][0]} 👍 🆚 ${player2Name}`,
            {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
              reply_markup: cuefaKeyboard,
            }
          );
        }
      } else {
        bot.answerCallbackQuery(query.id, {
          text: "Ты уже сделал ход, жди ход соперника!",
        });
      } //если у первого игрока не было хода, то записываю ход
    } else if (cuefaPlayers[query.message.message_id][1] == "undefined") {
      const newPlayer = {};
      newPlayer[query.from.username] = { select: cuefaToEmoji[query.data] };
      cuefaColl[query.message.message_id].player2 = newPlayer;
      cuefaColl[query.message.message_id].steps.player2Step = true;
      cuefaPlayers[query.message.message_id][1] = query.from.username;
      cuefaPlayer2Id[query.message.message_id] = query.from.id;

      if (!cuefaColl[query.message.message_id].steps.player1Step) {
        bot.editMessageText(
          `Камень, ножницы, бумага
@${cuefaPlayers[query.message.message_id][0]} 🆚 👍 @${cuefaPlayers[query.message.message_id][1]}`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: cuefaKeyboard,
          }
        );
      }
    } else if (cuefaPlayers[query.message.message_id][1] == query.from.username) {
      if (!cuefaColl[query.message.message_id].steps.player2Step) {

        cuefaColl[query.message.message_id].player2[query.from.username].select = cuefaToEmoji[query.data];
        cuefaColl[query.message.message_id].steps.player2Step = true;
        cuefaPlayer2Id[query.message.message_id] = query.from.id;

        if (!cuefaColl[query.message.message_id].steps.player1Step) {
          bot.editMessageText(
            `Камень, ножницы, бумага
@${cuefaPlayers[query.message.message_id][0]} 🆚 👍 ${player2Name}`,
            {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
              reply_markup: cuefaKeyboard,
            }
          );
        }
      } else {
        bot.answerCallbackQuery(query.id, {
          text: "Ты уже сделал ход, жди ход соперника!",
        });
      }
    } else {
      bot.answerCallbackQuery(query.id, {
        text: "Эта сессия не для тебя :( Создай новую!",
      });
    }

    if (
      cuefaColl[query.message.message_id].steps.player1Step &&
      cuefaColl[query.message.message_id].steps.player2Step
    ) {
      const step1 =
        cuefaColl[query.message.message_id].player1[cuefaPlayers[query.message.message_id][0]].select;
      const step2 =
        cuefaColl[query.message.message_id].player2[cuefaPlayers[query.message.message_id][1]].select;
      let winner;

      let winName;
      let winId;
      let loseName;
      let loseId;
      let noWin = false;

      if (step1 == "🤜" && step2 == "✌️") {
        winner = `Победитель - @${cuefaPlayers[query.message.message_id][0]} 🏆`;
        winName = cuefaPlayers[query.message.message_id][0];
        winId = cuefaPlayer1Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][1];
        loseId = cuefaPlayer2Id[query.message.message_id];
      }

      if (step1 == "🤜" && step2 == "✋") {
        winner = `Победитель - @${cuefaPlayers[query.message.message_id][1]} 🏆`;
        winName = cuefaPlayers[query.message.message_id][1];
        winId = cuefaPlayer2Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][0];
        loseId = cuefaPlayer1Id[query.message.message_id];
      }

      if (step1 == "✌️" && step2 == "✋") {
        winner = `Победитель - @${cuefaPlayers[query.message.message_id][0]} 🏆`;
        winName = cuefaPlayers[query.message.message_id][0];
        winId = cuefaPlayer1Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][1];
        loseId = cuefaPlayer2Id[query.message.message_id];
      }

      if (step1 == "✌️" && step2 == "🤜") {
        winner = `Победитель - @${cuefaPlayers[query.message.message_id][1]} 🏆`;
        winName = cuefaPlayers[query.message.message_id][1];
        winId = cuefaPlayer2Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][0];
        loseId = cuefaPlayer1Id[query.message.message_id];
      }

      if (step1 == "✋" && step2 == "✌️") {
        winner = `Победитель - @${cuefaPlayers[query.message.message_id][1]} 🏆`;
        winName = cuefaPlayers[query.message.message_id][1];
        winId = cuefaPlayer2Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][0];
        loseId = cuefaPlayer1Id[query.message.message_id];
      }

      if (step1 == "✋" && step2 == "🤜") {
        winner = `Победитель - @${cuefaPlayers[query.message.message_id][0]} 🏆`;
        winName = cuefaPlayers[query.message.message_id][0];
        winId = cuefaPlayer1Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][1];
        loseId = cuefaPlayer2Id[query.message.message_id];
      }

      if (step1 == step2) {
        winner = `Ничья 🤝`
        winName = cuefaPlayers[query.message.message_id][0];
        winId = cuefaPlayer1Id[query.message.message_id];
        loseName = cuefaPlayers[query.message.message_id][1];
        loseId = cuefaPlayer2Id[query.message.message_id];
        noWin = true;
      }

      if (cuefaPlayer1Id[query.message.message_id] == cuefaPlayer2Id[query.message.message_id]) {
        bot.editMessageText(
          `Ошибка!`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: {
              inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "cuefaReplay" }]]
            }
          }
        ).then(() => {
          delete cuefaColl[query.message.message_id];
          delete cuefaPlayers[query.message.message_id];
        });

        return;
      }

      if (isMeme) {//если чат доверенный
        setCuefaStats(String(winId), winName, String(loseId), loseName, noWin, () => {
          fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
            let stats = JSON.parse(data);

            bot.editMessageText(
              `Камень, ножницы, бумага
  @${cuefaPlayers[query.message.message_id][0]} ${step1} 🆚 ${step2} @${cuefaPlayers[query.message.message_id][1]}

  ${winner}

  @${stats[String(cuefaPlayer1Id[query.message.message_id])].name}: ${stats[String(cuefaPlayer1Id[query.message.message_id])].vs[String(cuefaPlayer2Id[query.message.message_id])][0]}
  @${stats[String(cuefaPlayer2Id[query.message.message_id])].name}: ${stats[String(cuefaPlayer2Id[query.message.message_id])].vs[String(cuefaPlayer1Id[query.message.message_id])][0]}`,
              {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                  inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "cuefaReplay" }]]
                }
              }
            ).then(() => {
              setTimeout(() => {
                delete cuefaColl[query.message.message_id];
                delete cuefaPlayers[query.message.message_id];
                delete cuefaPlayer1Id[query.message.message_id];
                delete cuefaPlayer2Id[query.message.message_id];
              }, 5000);
            });
          });
        });
      } else { //если чат не является доверенным
        bot.editMessageText(
          `Камень, ножницы, бумага
@${cuefaPlayers[query.message.message_id][0]} ${step1} 🆚 ${step2} @${cuefaPlayers[query.message.message_id][1]}

${winner}`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: {
              inline_keyboard: [[{ text: "Полная версия игры", url: "meme_house_chat.t.me" }]]
            }
          }
        ).then(() => {
          setTimeout(() => {
            delete cuefaColl[query.message.message_id];
            delete cuefaPlayers[query.message.message_id];
            delete cuefaPlayer1Id[query.message.message_id];
            delete cuefaPlayer2Id[query.message.message_id];
          }, 5000);
        });
      }

    }
  }
};

//__________________________________________________

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

function hiCount(query, options, collection, userId = undefined) {
  const messageId = query.message.message_id;

  if (!collection[messageId]) {
    collection[messageId] = {
      count: 1,
      users: [],
    };
  }

  if (userId && collection[messageId]["users"].includes(userId)) {
    bot.answerCallbackQuery(query.id, {
      text: "Ты уже поприветствовал участника!",
      show_alert: true,
    });
  } else {
    collection[messageId].count += 1;

    if (userId) {
      collection[messageId]["users"].push(userId);
    }

    bot.editMessageReplyMarkup(options, {
      chat_id: query.message.chat.id,
      message_id: messageId,
    });

    fs.writeFile(
      "../hiMembers.json",
      JSON.stringify(collection),
      "UTF-8",
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
};

bot.on("callback_query", (query) => {
  const messageId = query.message.message_id;

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
        ],
      };

      hiCount(query, opts, counts, query.from.id);
    });
  }

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
              bot.sendMessage(chatId, "Участник исключен из чата");
            })
            .catch((error) => {
              console.log(error);
              bot.sendMessage(
                chatId,
                "Произошла ошибка при исключении участника"
              );
            });
        } else {
          bot.sendMessage(chatId, "Ты кто такой, чтобы такое делать?");
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
        inline_keyboard: [[{ text: "Привет! \u{1F44b}", callback_data: "hi" }]],
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
