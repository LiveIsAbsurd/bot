const timeDuration = require("./time-duration.js");

const getInfo = async (msg, chatState, wordsCount, bot, chartJsCanvas, fs) => {
    const user = msg.reply_to_message ? msg.reply_to_message.from.id : msg.from.id;
    const dates = Object.keys(chatState.messageOnDate);

    const secondMessage = dates.find(el => {
        return chatState.messageOnDate[el].userMessage[user] ? true : false;
    })
    const indexOfSecondMessage = dates.indexOf(secondMessage);
    dates.splice(0, indexOfSecondMessage);

    const values = dates.map((date) => {
        return chatState.messageOnDate[date].userMessage[user] ? chatState.messageOnDate[date].userMessage[user].count : 0;
    });

    const averangeCount = values.reduce((acc, value) => acc + value, 0) / values.length;

    const configuration = {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: `Количество сообщений от ${chatState.userMessage[user].userFirstName} за всё время`,
                data: values,
                fill: true,
                backgroundColor: '#96188a',
            }]
        }
    };

    const image = await chartJsCanvas.renderToBuffer(configuration);

    let desc = `_Пусто_`;

    const allDesc = JSON.parse(fs.readFileSync("../adminDescriptions.json", "UTF-8"));
    allDesc[user] ? desc = allDesc[user] : null;


    const rewards = chatState.userMessage[user].rewards
                    ? chatState.userMessage[user].rewards.map((reward) => `🏆 ${reward.name}, ${timeDuration(reward.date)}`).join('\n')
                    : 'пусто';

    let favoriteWords = "Пусто..."
    let lexicon = wordsCount[user] ? Object.keys(wordsCount[user]).length : '0';

    if (wordsCount[user]) {
        favoriteWords = Object.entries(wordsCount[user])
            .sort((a, b) => {
            return b[1] - a[1];
            })
            .slice(0, 3)
            .map((el) => {
            return el[0];
            })
            .join(', ');
    }

    const caption = `
Участник ${chatState.userMessage[user].userName ? `[${chatState.userMessage[user].userFirstName.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}](https://t.me/${chatState.userMessage[user].userName})` : chatState.userMessage[user].userFirstName.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}.

Первое появление ${secondMessage}
В среднем ${averangeCount.toFixed(0)} сообщений в сутки
Меморитет: ${chatState.userMessage[user].authority ? chatState.userMessage[user].authority : 0}

📝О себе:
_${desc}_

Уникальных слов: ${lexicon} 

Любимые слова: ${favoriteWords}

Награды:
${rewards}`;

    bot.sendPhoto(msg.chat.id, image, {caption, parse_mode: 'Markdown'});
};

module.exports = getInfo;