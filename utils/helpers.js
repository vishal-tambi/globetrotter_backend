// backend/utils/helpers.js
module.exports = {
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    chunkArray: (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }
  };