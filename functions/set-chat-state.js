const token = require("../token.js");

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const { Module } = require("module");
const bot = new TelegramBot(token);

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

  module.exports = setChatState;