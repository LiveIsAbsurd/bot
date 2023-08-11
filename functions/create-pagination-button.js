function createPaginationButtons(array, currentPage, usersPerPage, cbDop) {
    let buttons = [];
    let totalPages = Math.ceil(array.length / usersPerPage);

    if (currentPage > 1) {
        buttons.push({
            text: "⬅️",
            callback_data: `prev-${cbDop}`,
        });
    }

    if (currentPage < totalPages) {
        buttons.push({
            text: "➡️",
            callback_data: `next-${cbDop}`,
        });
    }

    return buttons;
}

module.exports = createPaginationButtons;