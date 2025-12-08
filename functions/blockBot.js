const blockTrigs = ["работа", "требуется", "заработок", "долларов", "рублей", "заработать"];

const blockBot = (msg, chatState, bot) => {
    let userId = msg.from.id;
    const text = msg.text || msg.caption;
    const words = text.replace(/[^\p{L}]/gu, ' ').split(' ');

    if (!chatState.userMessage[userId] || chatState.userMessage[userId].count < 3) {

        for (let word of words) {
            if (blockTrigs.includes(word.toLocaleLowerCase())) {
                bot.restrictChatMember(msg.chat.id, user, {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false
                }).then(() => {
                    bot.sendMessage(msg.chat.id, 
                    `@liveisabsurd @yorigamy Предположительно бот заглушён`);
                });
                break;
            }
        }
    }

}

module.exports = blockBot;
