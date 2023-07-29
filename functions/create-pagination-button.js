function createPaginationButtons(array, currentPage, usersPerPage) {
    let buttons = [];
    let totalPages = Math.ceil(array.length / usersPerPage);

    if (currentPage > 1) {
        buttons.push({
            text: "⬅️",
            callback_data: "prev",
        });
    }

    if (currentPage < totalPages) {
        buttons.push({
            text: "➡️",
            callback_data: "next",
        });
    }

    return buttons;
}

module.exports = createPaginationButtons;