const wordsCounter = (msg, wordsCount) => {
    const userId = msg.from.id;
    const text = msg.text || msg.caption;
    if (!text) {
        return;
      }
    const words = text.replace(/[^\p{L}]/gu, ' ').split(' ')
    
    words.forEach((word) => {
      if (word.trim().length <= 2) {
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
  