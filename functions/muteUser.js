const muteUser = (msg, bot, adminList) => {
    // Проверка чата
    if (msg.chat.id != "-1002691894090") {
        return;
    }

    // Проверка: есть ли ответ на сообщение
    if (!msg.reply_to_message) {
        bot.sendMessage(msg.chat.id, '❌ Ответь на сообщение пользователя, которого хочешь заглушить!');
        return;
    }

    const user = msg.reply_to_message.from.id;
    const targetUsername = msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;

    // Проверка: нельзя заглушить админа
    if (adminList.includes(user)) {
        bot.sendMessage(msg.chat.id, `❌ Нельзя заглушить администратора @${targetUsername}!`);
        return;
    }

    // Получаем время (по умолчанию 3600 секунд = 1 час)
    let time = parseInt(msg.text.replace('/mute', '').trim());
    if (isNaN(time) || time <= 0) {
        time = 3600;
    }

    // Ограничиваем максимальное время (например, 7 дней)
    const maxTime = 604800; // 7 дней в секундах
    if (time > maxTime) {
        time = maxTime;
        bot.sendMessage(msg.chat.id, `⏰ Максимальное время - 7 дней. Установлено ${time} секунд.`);
    }

    // Вычисляем until_date в СЕКУНДАХ (правильно!)
    const untilDate = Math.floor(Date.now() / 1000) + time;

    // Проверка, является ли отправитель админом
    if (adminList.includes(msg.from.id)) {
        // Админ глушит другого пользователя
        bot.restrictChatMember(msg.chat.id, user, {
            until_date: untilDate,
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
        }).then(() => {
            const timeText = formatTime(time);
            bot.sendMessage(
                msg.chat.id,
                `🔇 Пользователь @${targetUsername} заглушён на ${timeText}`,
                { reply_to_message_id: msg.message_id }
            );
        }).catch((error) => {
            console.error('Ошибка при глушении:', error);
            bot.sendMessage(msg.chat.id, `❌ Ошибка: ${error.message}`);
        });
    } else {
        // Обычный пользователь не может глушить других
        bot.sendMessage(
            msg.chat.id,
            `❌ У вас нет прав для глушения других пользователей!`,
            { reply_to_message_id: msg.message_id }
        );
    }
};

// Вспомогательная функция для форматирования времени
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds} секунд`;
    } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)} минут`;
    } else if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)} часов`;
    } else {
        return `${Math.floor(seconds / 86400)} дней`;
    }
}

export default muteUser;