const token = require("../token.js");

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const { json } = require("body-parser");

const cuefaGame = require("./functions/cuefa-game.js");
const getUserCuefaStats = require("./functions/get-user-cuefa-stats.js");

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
