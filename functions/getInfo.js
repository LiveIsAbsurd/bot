const getInfo = async (chatState, bot, chartJsCanvas) => {
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

    const caption = `
Участник ${chatState.userMessage[user].userName ? `[${chatState.userMessage[user].userFirstName}](https://t.me/${chatState.userMessage[user].userName})` : chatState.userMessage[user].userFirstName}.

Первое появление ${secondMessage}
В среднем ${averangeCount.toFixed(0)} сообщений в сутки
Меморитет: ${chatState.userMessage[user].authority ? chatState.userMessage[user].authority : 0}

📝О себе:
_${desc}_

Награды:
${rewards}`;

    bot.sendPhoto(msg.chat.id, image, {caption, parse_mode: 'Markdown'});
};

module.exports = getInfo;