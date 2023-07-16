const token = require('../token.js');

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('../../etc/letsencrypt/live/v2009105.hosted-by-vdsina.ru/privkey.pem'),
  cert: fs.readFileSync('../../etc/letsencrypt/live/v2009105.hosted-by-vdsina.ru/fullchain.pem')
};

const bot = new TelegramBot(token, {polling: { interval: 3000 }});

bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.new_chat_member.username;

  if (!userName) {
    bot.sendMessage(chatId, `
Доброго времени суток, человек без никнейма!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Все правила в закрепе.
Желаю освоиться в нашем чатике!
Заходи на сайт нашего чата: https://liveisabsurd.github.io/Meme_House/`);
  } else {
    bot.sendMessage(chatId, `
Доброго времени суток, @${userName}!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Все правила в закрепе.
Желаю освоиться в нашем чатике!
Заходи на сайт нашего чата: https://liveisabsurd.github.io/Meme_House/`);
  }
  
});


bot.on('left_chat_member', (msg) => {
  const userName = msg.left_chat_member.username;
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `Пользователь ${userName} покинул нас.
Ну чтож... естественный отбор`);
});

https.createServer(options, app).listen(3001, 'v2009105.hosted-by-vdsina.ru', () => {
  console.log('Ура');
});

app.get('/sendUsersCount', (req, res) => {
  axios.get(`https://api.telegram.org/bot${token}/getChatMembersCount?chat_id=-1001807749316`)
    .then(response => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(response.data);
    })
    .catch(err => console.log(err));
    
})

app.get('/sendAdminList', (req, res) => {
  axios.get(`https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`)
    .then(response => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(response.data);
    })
    .catch(err => console.log(err));
})

app.get('/sendAdminInfo/:id', (req, res) => {
  axios.get(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${req.params.id}`)
    .then(response => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(response.data);
    })
    .catch(err => console.log(err));
})

app.get('/sendAdminPhotoInfo/:id', (req, res) => {
  axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${req.params.id}`)
    .then(response => {
      axios.get(`https://api.telegram.org/file/bot${token}/${response.data.result.file_path}`, {responseType: 'arraybuffer'})
      .then(response => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', 'image/jpeg');
        res.set('Content-Disposition', 'attachment; filename=image.jpg')
        res.send(response.data);
      })
    })
    .catch(err => console.log(err));
})

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Привет! Это оффициальный бот лучшего в телеграме чата https://t.me/meme_house_chat.
Присоединяйся!`);
});

bot.onText(/\/send (.+)/, (msg, match) => {
  const text = '';
  
  for (i in match) {
    if (typeof(i) !== string) {
      continue;
    } else {
      text += `\n ${i}`;
    }
  }
  
  console.log(msg, match);
  
  bot.sendMessage(msg.chat.id, text, parse_mode="Markdown");
})
