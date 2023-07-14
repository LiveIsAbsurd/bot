const token = require('../token.js');

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const axios = require('axios');

const bot = new TelegramBot(token, {polling: { interval: 3000 }});

bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.new_chat_member.username;

  if (!userName) {
    bot.sendMessage(chatId, `
Добрый день, человек без никнейма!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Все правила в закрепе.
Желаю освоиться в нашем чатике!`);
  } else {
    bot.sendMessage(chatId, `
Добрый день, @${userName}!
Добро пожаловать в наш замечательный и скромный чатик!
Чувствуйте себя как у @user148 дома!
Все правила в закрепе.
Желаю освоиться в нашем чатике!`);
  }
  
});


bot.on('left_chat_member', (msg) => {
  const userName = msg.left_chat_member.username;
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `Пользователь ${userName} покинул нас.
Ну чтож... естественный отбор`);
});

app.listen(3001, '77.246.96.226', () => {
  console.log('Ура');
})

app.get('/sendUsersCount', (req, res) => {
  axios.get(`https://api.telegram.org/bot${token}/getChatMembersCount?chat_id=-1001807749316`)
    .then(response => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.json(response.data);
    })
    .catch(err => console.log(err));
    
})

app.get('/sendAdminList', (req, res) => {
  axios.get('https://api.telegram.org/bot6384961507:AAGQU1IOXaJ7wUAlAiTm8S96hj1x7WMKm5E/getChatAdministrators?chat_id=-1001807749316')
    .then(response => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.json(response.data);
    })
    .catch(err => console.log(err));
})

app.get('/sendAdminInfo/:id', (req, res) => {
  axios.get(`https://api.telegram.org/bot6384961507:AAGQU1IOXaJ7wUAlAiTm8S96hj1x7WMKm5E/getUserProfilePhotos?user_id=${req.params.id}`)
    .then(response => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.json(response.data);
    })
    .catch(err => console.log(err));
})


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Привет! Это оффициальный бот лучшего в телеграме чата https://t.me/meme_house_chat.
Присоединяйся!`);
});
