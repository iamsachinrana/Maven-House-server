const { Response } = require('express');
const mongoose = require('mongoose');


const sendHttpResponse = (res, serverResponse) => {
  if (serverResponse instanceof Error) {

    if (serverResponse.name === 'ValidationError') {
      let message;
      const validationError = serverResponse;

      for (const path in validationError.errors) {
        switch (validationError.errors[path].name) {
          case 'ValidatorError':
            message = validationError.errors[path].message;
            break;
          case 'CastError':
            message = validationError.errors[path].message;
            break;
          default:
            message = 'Validation failed, Please submit valid data';
        }
        break;
      }
      res.status(422).send(message ? message : responses.MSG035);
    } else {
      res.status(500).send(serverResponse.message);
    }
  } else if (serverResponse.error) {
    res.status(serverResponse.code || 422).send(serverResponse.error);
  } else if (typeof serverResponse.data === 'object') {
    res.status(200).json(serverResponse.data);
  } else {
    res.status(200).send(serverResponse.data);
  }
};
/**
  * Send HTTP response to the client
  */
const getAsset = (asset, collection) => {
  try {
    if (asset)
      return `${process.env.CLIENT_URL}/${collection ? `${collection}/${asset}` : `${asset}`}`;
    return null;
  } catch (e) {
    return null;
  }
};

const getMultipleAssets = (assets, collection) => {
  try {
    if (assets && assets instanceof Array) return assets.map(asset => `${process.env.CLIENT_URL}/${collection ? `${collection}/${asset}` : `${asset}`}`);
    return null;
  } catch (e) {
    return null;
  }
};

const setAsset = (asset) => {
  try {
    if (asset) {
      const match = asset.match(/[a-z0-9]+[.][a-z0-9]+$/i);
      if (!match) return null;
      return match[0];
    }
    return null;
  } catch (e) {
    return null;
  }
};

const setMultipleAssets = (assets) => {
  try {
    if (assets && assets instanceof Array) {
      const _assets = [];
      assets.forEach(asset => {
        const match = asset.match(/[a-z0-9]+[.][a-z0-9]+$/i);
        if (match) _assets.push(match[0]);
      });
      return _assets;
    }
    return null;
  } catch (e) {
    return null;
  }
};

module.exports = { sendHttpResponse, getAsset, getMultipleAssets, setAsset, setMultipleAssets };