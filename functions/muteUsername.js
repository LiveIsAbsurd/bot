const muteUsername = (msg, bot, chatState, adminList) => {
    if (msg.chat.id != "-1001807749316") {
        return;
    };

    const userText = msg.text.replace("/muteus ", "").split(" ");
    const time = Number(userText.at(-1)) ? userText.at(-1) : 3600;
    const untilDate = Math.floor(Date.now() / 1000) + Number(time);
    Number(userText.at(-1)) ? userText.pop() : null;

    const usernames = userText.map((el) => {
        return el.replace("@", "")
    })

    const state = Object.fromEntries(
        Object.entries(chatState.userMessage).map(([id, user]) => [user.userName, id])
    );

    const usersID = usernames
        .map(el => state[el.toLowerCase()])
        .filter(id => id && !isNaN(id)); 

    console.log(usersID.length);

    if (adminList.includes(msg.from.id)) {
        usersID.forEach((user) => {
            bot.restrictChatMember(msg.chat.id, user, {
                until_date: untilDate,
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false
              })
        });

        bot.sendMessage(msg.chat.id, `Каждому по ебалу на ${time} секунд`, { reply_to_message_id: msg.message_id });
    }
}

module.exports = muteUsername;
