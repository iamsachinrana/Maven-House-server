
const { response } = require('express');
const md5 = require('md5');
const axios = require('axios').default;
let pathName = require('path');
const validatePhoneNumber = require('validate-phone-number-node-js');
let validator = require('validator');
const translations = require('../translations');

const adminModel = require('./adminModel');
const admin = new adminModel;


const validateData = require('../middlewares/validateData');
const { array } = require('../../multer.config');


class adminController {

  welcome(req, res) {
    res.sendFile('welcome.html', { root: `${ROOT_DIR}/public` });
  };

  errors(req, res) {
    res.sendFile('error.log', { root: `${ROOT_DIR}` });
  };

  logs(req, res) {
    res.sendFile('server.log', { root: `${ROOT_DIR}` });
  };


  verifyEvent(req, res) {
    const validationRule = {
      "id": "required",
      "status": "required"
    }
    validateData(req.body, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'validation failed',
            data: null,
            error: err
          });
      } else {
        const { id, status } = req.body;
        admin.verifyEventModel(id, status, (data, error) => {
          let response = { status: 0, data: null, error: null };
          if (data === false) {
            response.status = 0;
            response.error = error;
          } else {
            response.status = 1;
            response.data = data;
          }
          res.send(response);
        })
      }
    }).catch(err => console.log(err));
  }

};

module.exports = adminController;