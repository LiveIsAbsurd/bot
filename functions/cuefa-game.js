const token = require("../../token.js");

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const bot = new TelegramBot(token);

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

function setCuefaStats(winer, winerName, loser, loserName, noWin = false, getCuefaStats) {
    fs.readFile("../../cuefaStats.json", "UTF-8", (err, data) => {
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
  
      fs.writeFile("../../cuefaStats.json", JSON.stringify(stats), "UTF-8", (err) => {
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
${isMeme ? "" : `Это ограниченная версия игры, 
полная версия в meme_house_chat.t.me`}`,
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
            fs.readFile("../../cuefaStats.json", "UTF-8", (err, data) => {
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

  module.exports = cuefaGame;