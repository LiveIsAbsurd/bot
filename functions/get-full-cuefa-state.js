const fs = require("fs");


function getFullCuefaState(bot, cb) {
    fs.readFile("../cuefaStats.json", "UTF-8", (err, data) => {
      let stats = JSON.parse(data);
      let fullState = Object.values(stats);
  
      fullState.sort((a, b) => {
        return b.win - a.win;
      });
  
      cb(fullState);
      
     });
  };

export default getFullCuefaState;