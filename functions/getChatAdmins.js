import axios from "axios";

const getChatAdmins = (token, adminList) => {
    axios
        .get(
          `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1002691894090`
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

export default getChatAdmins;
