const { mongoose } = require('mongoose');
/**
 * Validate required file format of uploaded asset
 * 
 * @param file string
 * @param whitelist string[]
 * @returns boolean
 */
const isValidFileType = (file, whitelist) => {
  if (!file.includes('.')) {
    return false;
  } else {
    const regExpMatchArray = file.match(/[a-z0-9]+$/);
    if (regExpMatchArray && whitelist.includes(regExpMatchArray[0])) {
      return true;
    } else {
      return false;
    }
  }
};
module.exports = isValidFileType;