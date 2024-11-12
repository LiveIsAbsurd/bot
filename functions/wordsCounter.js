const wordBlackList = [
  'start', 'help','chatstate','kick','cuefa','xo','getcuefastats','getfullcuefastats','cat','top','memo','state','info','about', 'пока', 'этот', 'меня', 'meme',
  'house'
];

const wordsCounter = (msg, wordsCount) => {
    const userId = msg.from.id;
    const text = msg.text || msg.caption;
    if (!text) {
        return;
      }
    const words = text.replace(/[^\p{L}]/gu, ' ').split(' ')
    
    words.forEach((word) => {
      if (word.trim().length <= 3 || wordBlackList.includes(word.toLocaleLowerCase())) {
        return;
      }
  
      word = word.toLocaleLowerCase();
  
      if (!wordsCount[userId]) {
        wordsCount[userId] = {};
      }
  
      !wordsCount[userId][word] ?
      wordsCount[userId][word] = 1 :
      wordsCount[userId][word] += 1;
    })
  }

  module.exports = wordsCounter;
  