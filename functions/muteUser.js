const muteUser = (msg, bot, adminList) => {
    if (msg.chat.id != "-1001807749316") {
      return;
    };
  
    const user = msg.reply_to_message ? msg.reply_to_message.from.id : null;
    const time = msg.text.replace('/mute', '').trim() ? msg.text.replace('/mute', '').trim() : 3600;
    const untilDate = Math.floor(Date.now() / 1000) + Number(time);
  
    if (adminList.includes(msg.from.id)) {
      bot.restrictChatMember(msg.chat.id, user, {
        until_date: untilDate,
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false
      }).then(() => {
        bot.sendMessage(msg.chat.id, `Участник заглушён на ${time} секунд`, { reply_to_message_id: msg.message_id });
      });
    } else {
      bot.restrictChatMember(msg.chat.id, msg.from.id, {
        until_date: untilDate,
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false
      }).then(() => {
        bot.sendMessage(msg.chat.id, `Участник заглушён на ${time} секунд`, { reply_to_message_id: msg.message_id });
      });
    }//
  };

  module.exports = muteUser;
