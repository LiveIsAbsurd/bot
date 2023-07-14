const token = require('../token.js');

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const axios = require('axios');
// Введите ваш токен Telegram Bot API ниже:


// Создайте экземпляр бота
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

  // Далее можно выполнить нужное действие при выходе пользователя из чата, например, отправить сообщение админу чата
  bot.sendMessage(chatId, `Пользователь ${userName} покинул нас.
Ну чтож... естественный отбор`);
});

app.listen(3001, '77.246.96.226', () => {
  console.log('Ура');
})

app.get('/sendUsers', (req, res) => {
  axios.get('https://api.telegram.org/bot6384961507:AAGQU1IOXaJ7wUAlAiTm8S96hj1x7WMKm5E/getChatMembersCount?chat_id=-1001807749316')
    .then(data => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.json(data);
    })
    .catch(err => console.log(err));
    
})



// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Привет! Это оффициальный бот лучшего в телеграме чата https://t.me/meme_house_chat.
Присоединяйся!`);
});

// Обработка текстовых сообщений
//bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const text = msg.text;

//   // Ваш код обработки текстовых сообщений здесь

//   // Пример ответа на сообщение
//   bot.sendMessage(chatId, msg);
// });
