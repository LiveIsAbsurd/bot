const token = require("../token.js");

const express = require("express");
const app = express();
const axios = require("axios");
const https = require("https");
const fs = require("fs");

const options = {
    key: fs.readFileSync(
      "../../etc/letsencrypt/live/v3789.hosted-by-vdsina.com/privkey.pem"
    ),
    cert: fs.readFileSync(
      "../../etc/letsencrypt/live/v3789.hosted-by-vdsina.com/fullchain.pem"
    ),
  };
  
https
    .createServer(options, app)
    .listen(3001, "v3789.hosted-by-vdsina.com", () => {
        console.log("Ура");
    });

app.get("/sendAdminDescription/:adminId", (req, res) => {
    fs.readFile("../adminDescriptions.json", "UTF-8", (err, desc) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        const adminList = JSON.parse(desc);
    
        if (adminList[req.params.adminId]) {
        res.json(adminList[req.params.adminId]);
        } else {
        res.json("Описание отсутствует");
        }
    });
});
    
app.get("/sendUsersCount", (req, res) => {
    axios
        .get(
        `https://api.telegram.org/bot${token}/getChatMembersCount?chat_id=-1001807749316`
        )
        .then((response) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.json(response.data);
        })
        .catch((err) => console.log(err));
    });
    
app.get("/sendAdminList", (req, res) => {
    axios
        .get(
        `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=-1001807749316`
        )
        .then((response) => {
            res.setHeader("Access-Control-Allow-Origin", "*");

            const newData = response.data; 
            newData.result = response.data.result.filter(admin => {
                return admin.can_restrict_members || admin.status == "creator";
            })
            
            res.json(newData);
        })
        .catch((err) => console.log(err));
    });
    
app.get("/sendAdminInfo/:id", (req, res) => {
    axios
        .get(
        `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${req.params.id}`
        )
        .then((response) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.json(response.data);
        })
        .catch((err) => console.log(err));
    });
    
app.get("/sendAdminPhotoInfo/:id", (req, res) => {
    axios
        .get(
        `https://api.telegram.org/bot${token}/getFile?file_id=${req.params.id}`
        )
        .then((response) => {
        axios
            .get(
            `https://api.telegram.org/file/bot${token}/${response.data.result.file_path}`,
            { responseType: "arraybuffer" }
            )
            .then((response) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.set("Content-Type", "image/jpeg");
            res.set("Content-Disposition", "attachment; filename=image.jpg");
            res.send(response.data);
            });
        })
        .catch((err) => console.log(err));
});
    
app.get("/sendChatState", (req, res) => {
    fs.readFile("../chatStats.json", "UTF-8", (err, data) => {
        if (err) {
            console.log(err);
        }
        
        res.setHeader("Access-Control-Allow-Origin", "*");
        const state = JSON.parse(data, null, 2);

        res.json(state);
    });
});
    
app.get("/iswork", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json("Server Is Work!");
});

app.get("/searchVendor/:mac", (req, res) => {
    axios.get(`https://api.maclookup.app/v2/macs/${req.params.mac}`)
        .then(response => {
            console.log(response.data);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET");
            res.json(response.data.company);
        })
})