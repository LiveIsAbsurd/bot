const token = require("../token.js");

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const app = express();
const axios = require("axios");
const fs = require("fs");
const https = require("https");
const { json } = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
    
const url = "mongodb://127.0.0.1:27017/";

MongoClient.connect(url, (err, client) => {
  console.log('Connected to MongoDB');
  const db = client.db("botDB");
  const collection = db.collection("hiCount");

  // Обработка нажатий кнопок
  bot.on('callback_query', (query) => {
    const { message, data } = query;
  
      // Получить данные из коллекции
      collection.findOne({ buttonId: data }, (error, result) => {
        if (error) {
          console.error('MongoDB error:', error);
          return;
        }
    
        if (result) {
          // Обновить текст кнопки
          const keys = {
            inline_keyboard: [[{text: `${result.count}`, callback_data: 'key'}]]
          }
        
    
          bot.editMessageReplyMarkup(keys, { chat_id: query.message.chat.id, message_id: messageId });
    
          // Увеличить счетчик нажатий кнопки в базе данных
          collection.updateOne({ buttonId: data }, { $inc: { count: 1 } }, { upsert: true }, (error, result) => {
            if (error) {
              console.error('MongoDB error:', error);
              return;
            }
            console.log('Button click counter incremented');
          });
        }
      });

  });
});

function hiText(username) {
  let text = `
  Доброго времени суток, ${username}!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Все правила в закрепе.
Желаю освоиться в нашем чатике!
Заходи на сайт нашего чата: https://liveisabsurd.github.io/Meme_House/`;
  return text;
};

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

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/getKey/, (msg) => {

  const opts = {
    reply_markup: {
      inline_keyboard: [[{text: 'Кнопка 0', callback_data: 'key'}]]
    }
  }

  bot.sendMessage(msg.chat.id, 'Тестовая кнопка', opts)
});

// bot.on('callback_query', (query) => {
//   const messageId = query.message.message_id
//   if (query.data == 'key') {

    

//     const keys = {
//         inline_keyboard: [[{text: `Кнопка 1`, callback_data: 'key'}]]
//       }
    

//     bot.editMessageReplyMarkup(keys, { chat_id: query.message.chat.id, message_id: messageId });
//   }
// });

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
  const userName = msg.new_chat_member.username ? `@${msg.new_chat_member.username}` : msg.new_chat_member.first_name;

  // if (chatId == "-1001807749316") {
    bot.sendMessage(
      chatId,
      hiText(userName)
    )
  // }
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
  )
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
  res.json('Server Is Work!');
})