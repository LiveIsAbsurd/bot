const axios = require("axios");
const fs = require("fs");

const createStaticMessage = async (bot, token, msg, chatState, realDateGlobal) => {
    const message = await bot.sendMessage(msg.chat.id, 
`
Сообщений с 27.07.2023

+${chatState.messageOnDate[realDateGlobal] ?chatState.messageOnDate[realDateGlobal]?.totalMessage : 0} за сутки
`
    );
    const messageID = message.message_id;
    axios.get(`https://api.telegram.org/bot${token}/pinChatMessage?chat_id=${msg.chat.id}&message_id=${messageID}&disable_notification=${true}`);
    fs.writeFile("../info.json", JSON.stringify({staticMessageID: messageID}), "UTF-8", (err) => {
        console.log(err);
    });
    console.log(message)
}

module.exports = createStaticMessage;
