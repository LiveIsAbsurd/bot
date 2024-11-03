//крестики-нолики________________________________________________________
let xoPlace = {
    0: "◻️", 1: "◻️", 2: "◻️",
    3: "◻️", 4: "◻️", 5: "◻️",
    6: "◻️", 7: "◻️", 8: "◻️",
  };
  
  const winnComb = [[0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
  
  let xoKeys = {
    inline_keyboard: [
      [{ text: `${xoPlace[0]}`, callback_data: "xo0" }, { text: `${xoPlace[1]}`, callback_data: "xo1" }, { text: `${xoPlace[2]}`, callback_data: "xo2" }],
      [{ text: `${xoPlace[3]}`, callback_data: "xo3" }, { text: `${xoPlace[4]}`, callback_data: "xo4" }, { text: `${xoPlace[5]}`, callback_data: "xo5" }],
      [{ text: `${xoPlace[6]}`, callback_data: "xo6" }, { text: `${xoPlace[7]}`, callback_data: "xo7" }, { text: `${xoPlace[8]}`, callback_data: "xo8" }]
    ] 
  }

function xoGame(query, xoPlaceId, bot) {
    let id = query.message.message_id;
  
    if (!xoPlaceId[id]) {
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
      return;
    }
    
    if (xoPlaceId[id].player1.step == undefined && xoPlaceId[id].player1.id == query.from.id) {
      xoPlaceId[id].player1.step = xoPlaceId[id].step;
    }
    
    let playersId = {
  
      [xoPlaceId[id].player1.id]: {
        step: xoPlaceId[id].player1.step
      },
  
      [xoPlaceId[id].player2.id]: {
        step: xoPlaceId[id].player2.step
      }
    };
  
    if (xoPlaceId[id].player2.id == undefined && query.from.id != xoPlaceId[id].player1.id) {
      xoPlaceId[id].player2.id = query.from.id;
      xoPlaceId[id].player2.name = query.from.username ? query.from.username : query.from.first_name;
      xoPlaceId[id].player2.step = xoPlaceId[id].step;
      //console.log("Новый игрок!");
    } else if (query.from.id != xoPlaceId[id].player1.id && query.from.id != xoPlaceId[id].player2.id) {
      bot.answerCallbackQuery(query.id, {
        text: "Эта сессия не для тебя :( Создай новую!",
      });
      return;
    }
  
    if (xoPlaceId[id][query.data.replace("xo", "")] == "❌" || xoPlaceId[id][query.data.replace("xo", "")] == "⭕️") {
      bot.answerCallbackQuery(query.id, {
        text: "Клетка занята",
      });
      return;
    } else if (Object.keys(playersId).includes(String(query.from.id)) && playersId[query.from.id].step != xoPlaceId[id].step) {
      bot.answerCallbackQuery(query.id, {
        text: "Не твой ход",
      });
      return;
    } else if (xoPlaceId[id].step == "❌") {
      xoPlaceId[id][query.data.replace("xo", "")] = xoPlaceId[id].step;
      xoPlaceId[id].step = "⭕️";
  
      for (el in xoPlaceId[id]) {
        if ((el == "player1" || el == "player2") && xoPlaceId[id][el].id == query.from.id) {
          xoPlaceId[id][el].stepsArr.push(query.data.replace("xo", ""));
        }
      }
      //console.log(xoPlaceId[id]);
    } else {
      xoPlaceId[id][query.data.replace("xo", "")] = xoPlaceId[id].step;
      xoPlaceId[id].step = "❌";
  
      for (el in xoPlaceId[id]) {
        if ((el == "player1" || el == "player2") && xoPlaceId[id][el].id == query.from.id) {
          xoPlaceId[id][el].stepsArr.push(query.data.replace("xo", ""));
        }
      }
      //console.log(xoPlaceId[id]);
    }
   
  
    xoPlaceId[id].stepCount += 1;
  
    let winner;
  
    winnComb.forEach(comb => {
      let win1 = comb.every(el => {
        return xoPlaceId[id].player1.stepsArr.includes(String(el))
      });
  
      let win2 = comb.every(el => {
        return xoPlaceId[id].player2.stepsArr.includes(String(el))
      });
  
      if (win1) {
        winner = xoPlaceId[id].player1.name;
      } else if (win2) {
        winner = xoPlaceId[id].player2.name;
      }
    })
  
    if (winner) {
      xoGameStop(query, id, false, winner, xoPlaceId, bot);
      return;
    }
  
    if (xoPlaceId[id].stepCount == 9) {
      xoGameStop(query, id, true, undefined, xoPlaceId, bot);
      return;
    }
  
    keys = {
      inline_keyboard: [
        [{ text: `${xoPlaceId[id][0]}`, callback_data: "xo0" }, { text: `${xoPlaceId[id][1]}`, callback_data: "xo1" }, { text: `${xoPlaceId[id][2]}`, callback_data: "xo2" }],
        [{ text: `${xoPlaceId[id][3]}`, callback_data: "xo3" }, { text: `${xoPlaceId[id][4]}`, callback_data: "xo4" }, { text: `${xoPlaceId[id][5]}`, callback_data: "xo5" }],
        [{ text: `${xoPlaceId[id][6]}`, callback_data: "xo6" }, { text: `${xoPlaceId[id][7]}`, callback_data: "xo7" }, { text: `${xoPlaceId[id][8]}`, callback_data: "xo8" }]
      ] 
    }
  
    bot.editMessageText(
    `Крестики-нолики
  
  ${xoPlaceId[id].player1.name}${xoPlaceId[id].player1.step ? xoPlaceId[id].player1.step : ""} 
  🆚
  ${xoPlaceId[id].player2.name ? `${xoPlaceId[id].player2.name}${xoPlaceId[id].player2.step ? xoPlaceId[id].player2.step : ""}` : "(Ожидание игрока)"}
  
  Ходит ${xoPlaceId[id].step}`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: keys,
      }
    );
  }
  
  function xoGameStart(msg, query = undefined, xoPlaceId, bot) {
    let name1;
  
    if (msg) {
      name1 = msg.from.username ? msg.from.username : msg.from.first_name;
    } else {
      name1 = query.from.username ? query.from.username : query.from.first_name;
    }
  
    let player1 = {
      id: query ? query.from.id : msg.from.id,
      name: name1,
      step: undefined,
      stepsArr: []
    }
  
    let player2 = {
      id: undefined,
      name: undefined,
      step: undefined,
      stepsArr: []
    }
  
    bot.sendMessage(query ? query.message.chat.id : msg.chat.id,
      `Крестики-нолики
  
  ${player1.name} 
  🆚 
  (Ожидание игрока)
  
  Ходит ❌`,
      {
      reply_markup: {
        ...xoKeys
      }
    }).then(msg => {
      xoPlaceId[msg.message_id] = {
        ...xoPlace, stepCount: 0, step: "❌",
          player1: { ...player1 },
          player2: { ...player2 }
      };
    });
  }
  
  function xoGameStop(query, id, noWin, winner, xoPlaceId, bot) {
    let place = "";
    Object.values(xoPlaceId[id]).forEach((el, i) => {
      if (i < 9) {
        if (i % 3 == 0 && i != 0) {
          place += `\n`
        }
        place += el;
      }
    });
    //console.log("Конец");
    bot.editMessageText(
      `Крестики-нолики
  
${xoPlaceId[id].player1.name}${xoPlaceId[id].player1.step ? xoPlaceId[id].player1.step : ""}
  🆚
${xoPlaceId[id].player2.name}${xoPlaceId[id].player2.step ? xoPlaceId[id].player2.step : ""}
  
${noWin ? "Ничья 🤝" : `Победитель - ${winner} 🏆`}
  
${place}`,
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: {
            inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "xoReplay" }]]
          }
        }
    ).then(msg => {
      delete xoPlaceId[msg.message_id]
    });
  }
  //крестики-нолики________________________________________________________

  module.exports = {xoGame, xoGameStart};
