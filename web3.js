const Web3 = require('web3');
const { AbiItem } = require('web3-utils');
const { Contract } = require('web3-eth-contract');
const { HttpProvider, WebsocketProvider, Account, TransactionReceipt } = require('web3-core');
const { WebsocketProviderOptions } = require('web3-core-helpers');
// const { Chain, Provider, Event, Token } = require('../types');
// const Contracts = require('./contracts');
// const { OrderSide } = require('../models/Arts');

const web3 = new Web3();
/**
 * Get a provider for a web3 using chain and provider type
 * 
 * @param chain Chain
 * @param type Provider
 * @returns string | null
 */
const getProvider = (chain, type) => {
  const options = {
    // Enable auto reconnection
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false
    }
  };

  if (chain === 'ETHEREUM') {
    if (type && type === 1) {
      return new Web3.providers.WebsocketProvider(process.env.WSS_ETHEREUM_PROVIDER || '', options);
    } else {
      return new Web3.providers.HttpProvider(process.env.HTTPS_ETHEREUM_PROVIDER || '');
    }
  } else if (chain === 'POLYGON') {
    if (type && type === 1) {
      return new Web3.providers.WebsocketProvider(process.env.WSS_POLYGON_PROVIDER || '', options);
    } else {
      return new Web3.providers.HttpProvider(process.env.HTTPS_POLYGON_PROVIDER || '');
    }
  } else {
    return null;
  }
};

/**
 * Get ethereum zero address
 * 
 * @returns string
 */
const getZeroAddress = () => {
  return '0x0000000000000000000000000000000000000000';
};

/**
 * Contracts json interfaces mapping with chain
 */
/*module.exports = contractJsonInterfaces = {
  Registry: Contracts.Registry,
  Exchange: Contracts.Exchange,
  AssetContractShared: Contracts.AssetContractShared,
  WETH: Contracts.WETH,
  MATIC: Contracts.MATIC
}; */

/**
 * Deployed exchange contract on network
 */
module.exports = exchange = {
  ETHEREUM: {
    ETH: '0x8474Cf2e5aD5aAcB07628569a2E0dC5996665a8D',
    WETH: '0x8474Cf2e5aD5aAcB07628569a2E0dC5996665a8D'
  },
  POLYGON: {
    MATIC: '0x35E6e8B4218d0372D57406d45C0645680a352a39',
    WMATIC: '0x35E6e8B4218d0372D57406d45C0645680a352a39'
  }
};


/**
 * Deployed contracts on network
 */
/*modeule.exports = contracts = {
  ETHEREUM: {
    Registry: '0x3E86715D2858b2d1Fe075a536BC9a86830b8a67D',
    AssetContractShared: '0x4e58a8024ABb96169CEe83932523AC478956563c'
  },
  POLYGON: {
    Registry: '0x6Bfa757b740b7cee3EA6ac55bB9369881E164f48',
    AssetContractShared: '0x85d490B274d7BF7c5BdE005e3fA37B2d275bf691'
  }
}; */

/**
 * Token contract address on network
 */
module.exports = tokenAddress = {
  ETHEREUM: {
    ETH: getZeroAddress(),
    WETH: '0xc778417E063141139Fce010982780140Aa0cD5Ab'
  },
  POLYGON: {
    MATIC: getZeroAddress(),
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
  }
};

/**
 * Get deployed contract address on chain
 * 
 * @param chain Chain
 * @param contract string
 * @param token Token
 * @returns string
 */
/*const getContractAddress = (chain, contract, token) => {
  if (contract === 'Exchange' && token) {
    return exchange[chain][token] || getZeroAddress();
  } else if (contract !== 'Exchange') {
    return contracts[chain][contract] || getZeroAddress();
  } else {
    return getZeroAddress();
  }
}; */

/**
 * Wallets public & private key
 */
/*module.exports = wallets = {
  ETHEREUM: new Web3(getProvider(Chain.ETHEREUM, Provider.HTTPS)).eth.accounts.privateKeyToAccount(process.env.WALLET_PRIVATE_KEY || ''),
  POLYGON: new Web3(getProvider(Chain.POLYGON, Provider.HTTPS)).eth.accounts.privateKeyToAccount(process.env.WALLET_PRIVATE_KEY || '')
}; */

/**
 * Get wallet public address
 * 
 * @param chain Chain
 * @returns string
 */
const getWalletAddress = (chain) => {
  if (wallets[chain]) {
    return wallets[chain]?.address || getZeroAddress();
  } else {
    return getZeroAddress();
  }
};

/**
 * Transfer amount to the `to` wallet address
 * 
 * @param chain Chain
 * @param to string
 * @param amount number
 * @returns Promise<TransactionReceipt | Error>
 */
const transferAmount = async (chain, paymentToken, to, amount) => {
  try {
    const wallet = wallets[chain];

    if (wallet) {
      const web3 = new Web3(getProvider(chain, Provider.HTTPS));

      if (web3.utils.toChecksumAddress(wallet.address) === web3.utils.toChecksumAddress(to)) {
        return null;
      }

      const tx = {};

      if (paymentToken === Token.ETH || paymentToken === Token.MATIC) {
        tx.from = wallet.address;
        tx.to = to;
        tx.value = web3.utils.toWei(amount.toString());
      } else {
        const contract = getContractInstance(
          paymentToken,
          tokenAddress[chain][paymentToken],
          chain
        );

        tx.from = wallet.address;
        tx.to = tokenAddress[chain][paymentToken];
        tx.value = 0;
        tx.data = contract.methods.transfer(to, web3.utils.toWei(amount.toString())).encodeABI();
      }

      tx.gas = await web3.eth.estimateGas(tx);

      const signedTx = await wallet.signTransaction(tx).catch((err) => err);

      if (signedTx instanceof Error) return signedTx;
      if (signedTx.rawTransaction) {
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
      } else {
        return new Error('Signed transaction have undefined rawTransaction');
      }
    } else {
      return new Error(`Wallet not found to make transaction for chain '${chain}'`);
    }
  } catch (e) {
    return e;
  }
};

/**
 * To get instance of smart contract
 * 
 * @param contract string
 * @param chain Chain
 * @returns 
 */
const getContractInstance = (contract, address, chain, provider) => {
  const web3 = new Web3(getProvider(chain, provider));
  return new web3.eth.Contract(contractJsonInterfaces[contract], address);
};

/**
 * To get authentication consent message
 * 
 * @param address string
 * @param nonce number
 * @returns string
 */
const getAuthConsentMessage = (address, nonce) => {
  return `Welcome to Maven!\n\nClick to sign in and accept the Artzcape Terms of Service: ${process.env.CLIENT_URL}/tos\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nYour authentication status will reset after 24 hours.\n\nWallet address:\n${web3.utils.toChecksumAddress(address)}\n\nNonce:\n${nonce}`;
};

/**
 * Hashes the given message 
 * 
 * @param message string
 * @returns string
 */
const getHashMessage = (message) => {
  return web3.eth.accounts.hashMessage(message);
};

/**
 * Generate a big integer token id for a new token
 * 
 * @param address string
 * @param index number
 * @param supply number
 * @returns string
 */
const generateTokenId = (address, index, supply) => {
  return web3.utils.hexToNumberString(
    address +
    web3.utils.padLeft(web3.utils.numberToHex(index).replace('0x', ''), 14) +
    web3.utils.padLeft(web3.utils.numberToHex(supply).replace('0x', ''), 10)
  );
};

/**
 * Generate calldata for any method of smart contract
 * 
 * @param address string
 * @param contract string
 * @param chain Chain
 * @param method string
 * @param params unknown[]
 * @returns string
 */
const getCalldata = (chain, contract, method, ...params) => {
  try {
    const contractInstance = getContractInstance(contract, getContractAddress(chain, contract), chain);
    return web3.utils.hexToBytes(contractInstance.methods[method](...params).encodeABI());
  } catch (e) {
    return [];
  }
};
/**
 * Get replacement pattern of calldata
 */
const getReplacementPattern = (side) => {
  if (side === 0) {
    return web3.utils.hexToBytes(
      web3.utils.padLeft('0x0', 8) +
      web3.utils.toTwosComplement('-1').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2)
    );
  } else {
    return web3.utils.hexToBytes(
      web3.utils.padLeft('0x0', 8) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('-1').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2) +
      web3.utils.toTwosComplement('0x0').slice(2)
    );
  }
};

/**
 * Subscribe for an event log of smart contract
 * 
 * @param contract Contract
 * @param chain Chain
 * @param event string
 * @param callback (err: Error | null, event?: Event) => Promise<void>
 * @returns void
 */
const subscribeEvent = (contract, chain, event, callback) => {
  contract.events[event]()
    .on('connected', (subscriptionId) => {
      console.debug(`Chain: ${chain}, Subscribe for a event '${event}', subscriptionId: ${subscriptionId}`);
    })
    .on('error', (err) => {
      callback(err);
    })
    .on('data', (event) => {
      callback(null, chain, event);
    })
    .on('changed', (event) => {
      callback(null, chain, event);
    });
};

/**
 * Get transaction gas fees by transaction hash
 * 
 * @param transactionHash string
 * @param chain Chain
 * @returns Promise<number | Error>
 */
const getTransactionGasFees = async (transactionHash, chain) => {
  const web3 = new Web3(getProvider(chain, Provider.HTTPS));
  const transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash).catch((err) => err);

  if (transactionReceipt instanceof Error) return transactionReceipt;

  const gas = Number(web3.utils.fromWei(`${transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice}`));
  return gas;
};

module.exports = { web3, getZeroAddress, getProvider, getWalletAddress, transferAmount, getContractInstance, getAuthConsentMessage, getHashMessage, generateTokenId, getCalldata, getReplacementPattern, subscribeEvent, getTransactionGasFees };