const token = require("../../token.js");

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token);

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

module.exports = hiCount;