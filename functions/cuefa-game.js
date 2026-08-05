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

function setCuefaStats(winer, winerName, loser, loserName, noWin = false, callback) {
    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
        if (err) {
            console.error('Ошибка чтения stats:', err);
            if (callback) callback();
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
            if (callback) {
                callback();
            }
        });
    });
}

function cuefaGame(bot, msg = null, query = null, replay = false, isMeme = false) {
    // ========== ОБРАБОТКА CALLBACK-ЗАПРОСА (ход игрока) ==========
    if (query && !replay) {
        const messageId = query.message.message_id;
        
        // Проверка: существует ли игра
        if (!cuefaColl[messageId]) {
            bot.editMessageText(
                "Время вышло или игра уже завершена!",
                {
                    chat_id: query.message.chat.id,
                    message_id: messageId
                }
            ).catch(() => {});
            return;
        }

        // Проверка: завершена ли игра
        if (cuefaColl[messageId].finished) {
            bot.answerCallbackQuery(query.id, {
                text: "Игра уже завершена!",
            });
            return;
        }

        const player1Name = cuefaPlayers[messageId][0];
        const player2Name = cuefaPlayers[messageId][1];
        const player2DisplayName = player2Name != "undefined" ? `@${player2Name}` : "(Ожидание игрока...)";

        // Если это первый игрок
        if (player1Name == query.from.username) {
            if (!cuefaColl[messageId].steps.player1Step) {
                // Сохраняем ход первого игрока
                cuefaColl[messageId].player1[query.from.username].select = cuefaToEmoji[query.data];
                cuefaColl[messageId].steps.player1Step = true;
                cuefaPlayer1Id[messageId] = query.from.id;

                // Если второй игрок еще не ходил - обновляем сообщение
                if (!cuefaColl[messageId].steps.player2Step) {
                    bot.editMessageText(
                        `Камень, ножницы, бумага
@${player1Name} 👍 
🆚
${player2DisplayName}`,
                        {
                            chat_id: query.message.chat.id,
                            message_id: messageId,
                            reply_markup: cuefaKeyboard,
                        }
                    ).catch(() => {});
                }
            } else {
                bot.answerCallbackQuery(query.id, {
                    text: "Ты уже сделал ход, жди ход соперника!",
                });
                return;
            }
        }
        // Если второй игрок еще не определен (ожидание)
        else if (player2Name == "undefined") {
            // Добавляем второго игрока
            const newPlayer = {};
            newPlayer[query.from.username] = { select: cuefaToEmoji[query.data] };
            cuefaColl[messageId].player2 = newPlayer;
            cuefaColl[messageId].steps.player2Step = true;
            cuefaPlayers[messageId][1] = query.from.username;
            cuefaPlayer2Id[messageId] = query.from.id;

            // Если первый игрок еще не ходил - обновляем сообщение
            if (!cuefaColl[messageId].steps.player1Step) {
                bot.editMessageText(
                    `Камень, ножницы, бумага
@${player1Name} 
🆚
@${query.from.username} 👍`,
                    {
                        chat_id: query.message.chat.id,
                        message_id: messageId,
                        reply_markup: cuefaKeyboard,
                    }
                ).catch(() => {});
            }
        }
        // Если это второй игрок
        else if (player2Name == query.from.username) {
            if (!cuefaColl[messageId].steps.player2Step) {
                // Сохраняем ход второго игрока
                cuefaColl[messageId].player2[query.from.username].select = cuefaToEmoji[query.data];
                cuefaColl[messageId].steps.player2Step = true;
                cuefaPlayer2Id[messageId] = query.from.id;

                // Если первый игрок еще не ходил - обновляем сообщение
                if (!cuefaColl[messageId].steps.player1Step) {
                    bot.editMessageText(
                        `Камень, ножницы, бумага
@${player1Name} 
🆚
${player2DisplayName} 👍`,
                        {
                            chat_id: query.message.chat.id,
                            message_id: messageId,
                            reply_markup: cuefaKeyboard,
                        }
                    ).catch(() => {});
                }
            } else {
                bot.answerCallbackQuery(query.id, {
                    text: "Ты уже сделал ход, жди ход соперника!",
                });
                return;
            }
        } else {
            bot.answerCallbackQuery(query.id, {
                text: "Эта сессия не для тебя :( Создай новую!",
            });
            return;
        }

        // ========== ПРОВЕРКА: ОБА ИГРОКА СДЕЛАЛИ ХОД ==========
        if (cuefaColl[messageId].steps.player1Step && cuefaColl[messageId].steps.player2Step) {
            const step1 = cuefaColl[messageId].player1[player1Name].select;
            const step2 = cuefaColl[messageId].player2[player2Name].select;
            
            let winner;
            let winName, winId, loseName, loseId;
            let noWin = false;

            // Определение победителя
            if (step1 == "🤜" && step2 == "✌️") {
                winner = `Победитель - @${player1Name} 🏆`;
                winName = player1Name;
                winId = cuefaPlayer1Id[messageId];
                loseName = player2Name;
                loseId = cuefaPlayer2Id[messageId];
            } else if (step1 == "🤜" && step2 == "✋") {
                winner = `Победитель - @${player2Name} 🏆`;
                winName = player2Name;
                winId = cuefaPlayer2Id[messageId];
                loseName = player1Name;
                loseId = cuefaPlayer1Id[messageId];
            } else if (step1 == "✌️" && step2 == "✋") {
                winner = `Победитель - @${player1Name} 🏆`;
                winName = player1Name;
                winId = cuefaPlayer1Id[messageId];
                loseName = player2Name;
                loseId = cuefaPlayer2Id[messageId];
            } else if (step1 == "✌️" && step2 == "🤜") {
                winner = `Победитель - @${player2Name} 🏆`;
                winName = player2Name;
                winId = cuefaPlayer2Id[messageId];
                loseName = player1Name;
                loseId = cuefaPlayer1Id[messageId];
            } else if (step1 == "✋" && step2 == "✌️") {
                winner = `Победитель - @${player2Name} 🏆`;
                winName = player2Name;
                winId = cuefaPlayer2Id[messageId];
                loseName = player1Name;
                loseId = cuefaPlayer1Id[messageId];
            } else if (step1 == "✋" && step2 == "🤜") {
                winner = `Победитель - @${player1Name} 🏆`;
                winName = player1Name;
                winId = cuefaPlayer1Id[messageId];
                loseName = player2Name;
                loseId = cuefaPlayer2Id[messageId];
            } else if (step1 == step2) {
                winner = `Ничья 🤝`;
                winName = player1Name;
                winId = cuefaPlayer1Id[messageId];
                loseName = player2Name;
                loseId = cuefaPlayer2Id[messageId];
                noWin = true;
            }

            // Проверка: если игроки - один и тот же человек
            if (cuefaPlayer1Id[messageId] == cuefaPlayer2Id[messageId]) {
                bot.editMessageText(
                    `Ошибка! Нельзя играть с самим собой!`,
                    {
                        chat_id: query.message.chat.id,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "cuefaReplay" }]]
                        }
                    }
                ).catch(() => {});
                
                // Очистка
                delete cuefaColl[messageId];
                delete cuefaPlayers[messageId];
                delete cuefaPlayer1Id[messageId];
                delete cuefaPlayer2Id[messageId];
                return;
            }

            // ========== ПОКАЗ РЕЗУЛЬТАТА ==========
            const resultText = `Камень, ножницы, бумага
@${player1Name} ${step1} 
🆚
@${player2Name} ${step2}
  
${winner}`;

            // Помечаем игру как завершенную
            cuefaColl[messageId].finished = true;

            if (isMeme) {
                // === ДОВЕРЕННЫЙ ЧАТ: сохраняем статистику ===
                setCuefaStats(String(winId), winName, String(loseId), loseName, noWin, () => {
                    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
                        if (err) {
                            console.error('Ошибка чтения stats:', err);
                            // Показываем результат без статистики
                            bot.editMessageText(
                                resultText,
                                {
                                    chat_id: query.message.chat.id,
                                    message_id: messageId,
                                    reply_markup: {
                                        inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "cuefaReplay" }]]
                                    }
                                }
                            ).catch(() => {});
                            
                            // Очистка
                            delete cuefaColl[messageId];
                            delete cuefaPlayers[messageId];
                            delete cuefaPlayer1Id[messageId];
                            delete cuefaPlayer2Id[messageId];
                            return;
                        }
                        
                        let stats = JSON.parse(data);
                        const player1Stats = stats[String(cuefaPlayer1Id[messageId])];
                        const player2Stats = stats[String(cuefaPlayer2Id[messageId])];
                        
                        const statText = player1Stats && player2Stats ? 
                            `\n\n📊 Статистика встреч:\n@${player1Stats.name}: ${player1Stats.vs[String(cuefaPlayer2Id[messageId])]?.[0] || 0} побед\n@${player2Stats.name}: ${player2Stats.vs[String(cuefaPlayer1Id[messageId])]?.[0] || 0} побед` :
                            '';

                        bot.editMessageText(
                            resultText + statText,
                            {
                                chat_id: query.message.chat.id,
                                message_id: messageId,
                                reply_markup: {
                                    inline_keyboard: [[{ text: "Повторить 🔄", callback_data: "cuefaReplay" }]]
                                }
                            }
                        ).catch(() => {});
                        
                        // Очистка
                        delete cuefaColl[messageId];
                        delete cuefaPlayers[messageId];
                        delete cuefaPlayer1Id[messageId];
                        delete cuefaPlayer2Id[messageId];
                    });
                });
            } else {
                // === ОБЫЧНЫЙ ЧАТ: показываем результат без статистики ===
                bot.editMessageText(
                    resultText + `\n\nПолная версия игры в @meme_house_chat`,
                    {
                        chat_id: query.message.chat.id,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [[{ text: "Полная версия игры", url: "https://t.me/meme_house_chat" }]]
                        }
                    }
                ).catch(() => {});
                
                // Очистка
                delete cuefaColl[messageId];
                delete cuefaPlayers[messageId];
                delete cuefaPlayer1Id[messageId];
                delete cuefaPlayer2Id[messageId];
            }
        }
        
        return;
    }

    // ========== СОЗДАНИЕ НОВОЙ ИГРЫ ==========
    if (msg || replay) {
        let player1Name;
        let chatId;
        
        if (replay && query) {
            // Рестарт игры
            player1Name = query.from.username;
            chatId = query.message.chat.id;
        } else if (msg) {
            // Новая игра из сообщения
            player1Name = msg.from.username;
            chatId = msg.chat.id;
        } else {
            console.error('Неверные параметры для создания игры');
            return;
        }

        if (!player1Name) {
            const target = msg || query;
            if (target) {
                bot.sendMessage(target.chat?.id || target.message?.chat?.id, "Для игры установи @username (имя пользователя)!");
            }
            return;
        }

        // Определяем второго игрока
        let player2Name = "undefined";
        let player2DisplayName = "(Ожидание игрока...)";
        
        if (!replay && msg && msg.reply_to_message) {
            const repliedUsername = msg.reply_to_message.from.username;
            if (repliedUsername) {
                player2Name = repliedUsername;
                player2DisplayName = `@${repliedUsername}`;
            } else {
                bot.sendMessage(msg.chat.id, "У пользователя, которому ты ответил, нет @username!");
                return;
            }
        } else if (!replay && msg && !msg.reply_to_message) {
            bot.sendMessage(msg.chat.id, "Ответь на сообщение пользователя, с которым хочешь играть!");
            return;
        }

        // Проверка: игра с самим собой
        if (player1Name == player2Name) {
            bot.sendMessage(chatId, "Хочешь играть с самим собой? 😅");
            return;
        }

        // Создаем игроков
        const player1 = {};
        player1[player1Name] = { select: undefined };

        const player2 = {};
        player2[player2Name] = { select: undefined };

        // Отправляем сообщение с игрой
        bot.sendMessage(
            chatId,
            `Камень, ножницы, бумага
@${player1Name} 
🆚
${player2DisplayName}
${isMeme ? "" : "Это ограниченная версия игры,\nполная версия в @meme_house_chat"}`,
            { reply_markup: cuefaKeyboard }
        ).then((sentMsg) => {
            const messageId = sentMsg.message_id;
            
            // Сохраняем состояние игры
            cuefaColl[messageId] = {
                steps: {
                    player1Step: false,
                    player2Step: false,
                },
                player1: player1,
                player2: player2,
                finished: false
            };
            
            cuefaPlayers[messageId] = [
                Object.keys(player1)[0],
                Object.keys(player2)[0],
            ];
        }).catch(err => {
            console.error('Ошибка отправки игры:', err);
        });
    }
}

export default cuefaGame;