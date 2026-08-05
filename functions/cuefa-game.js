import fs from "fs";

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
    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
        if (err) {
            console.error('Ошибка чтения stats:', err);
            return;
        }
        
        let stats = JSON.parse(data);

        if (!Object.keys(stats).includes(winer)) {
            if (!noWin) {
                stats[winer] = {
                    total: 1,
                    win: 1,
                    lose: 0,
                    vs: {},
                };
                stats[winer].name = winerName;
                stats[winer].vs[loser] = [1, 0, 0];
            } else {
                stats[winer] = {
                    total: 1,
                    win: 0,
                    lose: 0,
                    vs: {},
                };
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
                if (!Object.keys(stats[winer].vs).includes(loser)) {
                    stats[winer].vs[loser] = [1, 0, 0];
                } else {
                    stats[winer].vs[loser][0] += 1;
                }
            } else {
                if (!Object.keys(stats[winer].vs).includes(loser)) {
                    stats[winer].vs[loser] = [0, 0, 1];
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
                };
                stats[loser].name = loserName;
                stats[loser].vs[winer] = [0, 1, 0];
            } else {
                stats[loser] = {
                    total: 1,
                    win: 0,
                    lose: 0,
                    vs: {},
                };
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
                if (!Object.keys(stats[loser].vs).includes(winer)) {
                    stats[loser].vs[winer] = [0, 1, 0];
                } else {
                    stats[loser].vs[winer][1] += 1;
                }
            } else {
                if (!Object.keys(stats[loser].vs).includes(winer)) {
                    stats[loser].vs[winer] = [0, 0, 1];
                } else {
                    stats[loser].vs[winer][2] += 1;
                }
            }
        }

        fs.writeFile("../cuefaStats.json", JSON.stringify(stats), "UTF-8", (err) => {
            if (err) {
                console.log(err);
            }
            if (getCuefaStats) {
                getCuefaStats();
            }
        });
    });
}

function cuefaGame(bot, msg = null, query = null, replay = false, isMeme = false) {
    // Проверка: если это callback-запрос (игра уже начата)
    if (query && !replay) {
        // ... обработай callback запрос
        // (этот код нужно перенести из условия if (msg || replay))
    }
    
    // Если это новое сообщение или реплей
    if (msg || replay) {
        const player1 = {};
        const player1Name = replay ? query.from.username : msg.from.username;
        
        if (!player1Name) {
            bot.sendMessage(msg?.chat?.id || query?.message?.chat?.id, "У тебя нет username!");
            return;
        }
        
        player1[player1Name] = { select: undefined };

        const player2 = {};
        let player2Name;
        
        if (replay) {
            player2["undefined"] = { select: undefined };
            player2Name = "(Ожидание игрока...)";
        } else {
            const repliedUser = msg.reply_to_message ? msg.reply_to_message.from.username : undefined;
            if (!repliedUser) {
                bot.sendMessage(msg.chat.id, "Ответь на сообщение пользователя, с которым хочешь играть!");
                return;
            }
            player2[repliedUser] = { select: undefined };
            player2Name = `@${repliedUser}`;
        }

        const player1NameForDisplay = `@${player1Name}`;

        if (player1Name == Object.keys(player2)[0]) {
            bot.sendMessage(msg.chat.id, "Хочешь играть с самим собой?");
            return;
        }
        
        const chatId = replay ? query.message.chat.id : msg.chat.id;

        bot.sendMessage(
            chatId,
            `Камень, ножницы, бумага
${player1NameForDisplay} 
🆚
${player2Name}
${isMeme ? "" : "Это ограниченная версия игры, полная версия в meme_house_chat.t.me"}`,
            { reply_markup: cuefaKeyboard }
        ).then((msg) => {
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
        }).catch(err => console.error('Ошибка отправки:', err));
    }
}

export default cuefaGame;