const token = require("../token.js");

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const app = express();
const axios = require("axios");
const fs = require("fs");
const https = require("https");
const { json } = require("body-parser");

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

const options = {
  key: fs.readFileSync(
    "../../etc/letsencrypt/live/v2009105.hosted-by-vdsina.ru/privkey.pem"
  ),
  cert: fs.readFileSync(
    "../../etc/letsencrypt/live/v2009105.hosted-by-vdsina.ru/fullchain.pem"
  ),
};

https
  .createServer(options, app)
  .listen(3001, "v2009105.hosted-by-vdsina.ru", () => {
    console.log("Ура");
  });

const bot = new TelegramBot(token, { polling: { interval: 1000 } });

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
  // console.log(query);
  const messageId = query.message.message_id;

  if (collection[messageId]) {
    if (userId) {
      if (!collection[messageId]["users"]) {
        collection[messageId] = {
          count: 2,
          users: [],
        };
      }

      if (collection[messageId]["users"].indexOf(userId) >= 0) {
        bot.answerCallbackQuery(query.id, "Ты уже приветствовал участника!");
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
  } else {
    collection[messageId] = {
      count: 2,
      users: [],
    };

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
}

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

// API

app.get("/sendAdminDescription/:adminId", (req, res) => {
  fs.readFile("../adminDescriptions.json", "UTF-8", (err, desc) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const adminList = JSON.parse(desc);

    if (adminList[req.params.adminId]) {
      res.json(adminList[req.params.adminId]);
    } else {
      res.json("Описание отсутствует");
    }
  });
});

app.get("/sendUsersCount", (req, res) => {
  axios
    .get(
      `https://api.telegram.org/bot${token}/getChatMembersCount?chat_id=-1001807749316`
    )
    .then((response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(response.data);
    })
    .catch((err) => console.log(err));
});

app.get("/sendAdminList", (req, res) => {
  axios
    .get(
      `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`
    )
    .then((response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(response.data);
    })
    .catch((err) => console.log(err));
});

app.get("/sendAdminInfo/:id", (req, res) => {
  axios
    .get(
      `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${req.params.id}`
    )
    .then((response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(response.data);
    })
    .catch((err) => console.log(err));
});

app.get("/sendAdminPhotoInfo/:id", (req, res) => {
  axios
    .get(
      `https://api.telegram.org/bot${token}/getFile?file_id=${req.params.id}`
    )
    .then((response) => {
      axios
        .get(
          `https://api.telegram.org/file/bot${token}/${response.data.result.file_path}`,
          { responseType: "arraybuffer" }
        )
        .then((response) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.set("Content-Type", "image/jpeg");
          res.set("Content-Disposition", "attachment; filename=image.jpg");
          res.send(response.data);
        });
    })
    .catch((err) => console.log(err));
});

app.get("/iswork", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json("Server Is Work!");
});
