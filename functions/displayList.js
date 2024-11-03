const createPaginationButtons = require("./create-pagination-button.js");

function displayList(msg, query, array, usersPerPage, header, cbDop, state = undefined, bot, currentPage) {
  
    let start;
    if (!msg && query.data == "chatState") {
      start = 0;
    } else {
      start = query ? (currentPage[query.message.message_id] - 1) * usersPerPage : 0;
    }
    const end = start + usersPerPage;
    const page = array.slice(start, end);
    let message;
  
    if (cbDop == "cuefa") {
      message = page.map((el, index) => `${start + index + 1}. ${el.name ? `[${el.name}](https://t.me/${el.name})` : el.name} - ${el.total} | ${el.win} | ${el.lose} | ${isNaN(((el.win / (el.win + el.lose)) * 100).toFixed(2)) ? 0 : ((el.win / (el.win + el.lose)) * 100).toFixed(2)}%`).join('\n');
    }
  
    if (cbDop == "chatState") {
      const totalCount = state.totalMessage;
      message = page.map((el, index) => {
        let reward;
        let stateNum = start + index + 1;
  
        if (stateNum == 1) {
          reward = "🥇"
        } else if (stateNum == 2) {
          reward = "🥈"
        } else if (stateNum == 3) {
          reward = "🥉"
        }
  
        let percent = el.count/totalCount*100;
  
        let text = `${reward ? "" : `${stateNum}.`}${reward ? reward : ""} ${el.userName ? `[${el.userName}](https://t.me/${el.userName})` : el.userFirstName} - ${el.count}/${percent.toFixed(1)}%`;
        return text;
      }).join('\n');
    }
  
    if (cbDop == 'authority') {
      message = page.map((el, i) => {
        let reward;
        let stateNum = start + i + 1;
  
        if (stateNum == 1) {
          reward = "🥇"
        } else if (stateNum == 2) {
          reward = "🥈"
        } else if (stateNum == 3) {
          reward = "🥉"
        }
  
        let text = 
        `
    ${reward ? "" : `${stateNum}.`}${reward ? reward : ""} ${el.userName ? `[${el.userName}](https://t.me/${el.userName})` : el.userFirstName} - ${el.authority}
        `;
        return text;
      }).join('\n');
    } //new
  
    let qq;
    if (!msg && query.data == "chatState") {
      qq = 1
    } else {
      qq = query ? currentPage[query.message.message_id] : 1;
    }
  
    let buttons = createPaginationButtons(array, qq, usersPerPage, cbDop);
  
    let options = {
        reply_markup: {
            inline_keyboard: [buttons],
        },
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
    };
  
    if (msg || query.data === "chatState") {
        bot.sendMessage(msg ? msg.chat.id : query.message.chat.id, 
  `
  ${header}
  
  ${message}
  `, options)
        .then(msg => {
            currentPage[msg.message_id] = 1;
        })
    } else if (query) {
        bot.editMessageText(
  `
  ${header}
  
  ${message}
  `, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            ...options,
        })
    }
  }


module.exports = displayList;
