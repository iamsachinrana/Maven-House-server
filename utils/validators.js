const { mongoose } = require('mongoose');

const { web3 } = require('../web3')
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


/**
 * Check two addresses are identical or not
 * 
 * @param address1 string
 * @param address2 string
 * @returns boolean
 */
const isEqualAddress = (address1, address2) => {

  try {
    return web3.utils.toChecksumAddress(address1) === web3.utils.toChecksumAddress(address2);
  } catch (e) {
    return false;
  }
};



/**
 * Verify signer of message
 * 
 * @param message string
 * @param publicAddress string
 * @param signature string
 * @returns boolean
 */
const verifySignature = (message, publicAddress, signature) => {

  try {

    const signer = web3.eth.accounts.recover(message, signature);

    console.log(signer, "signer")
    console.log(publicAddress, "publicAddress")

    // console.log(isEqualAddress(publicAddress, signer))
    return isEqualAddress(publicAddress, signer);
  } catch (e) {
    return false;
  }
};

module.exports = { isValidFileType, verifySignature, isEqualAddress };