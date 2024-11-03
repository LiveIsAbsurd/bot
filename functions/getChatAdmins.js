const getChatAdmins = (token, adminList) => {
    axios
        .get(
          `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`
        )
        .then((response) => {
          response.data.result.forEach((admin) => {
            if (admin.can_restrict_members || admin.status == "creator") {
              adminList.push(admin.user.id);
            }
          });
          console.log(adminList);
        });
  };

module.export = getChatAdmins;