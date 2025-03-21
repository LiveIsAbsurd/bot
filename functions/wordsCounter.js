const wordBlackList = [
  'start', 'help','chatstate','kick','cuefa', 'getcuefastats','getfullcuefastats','memo','state','info','about', 'пока', 'этот', 'меня', 'meme',
  'house', 'было', 'если', 'будет', 'просто', 'может', 'сейчас', 'тоже', 'тебя', 'вообще', 'только'
];

const wordsCounter = (msg, wordsCount) => {
    const userId = msg.from.id;
    const text = msg.text || msg.caption;
    
    if (!text) {
      return;
    }

    if (text[0] == '/') {
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
  