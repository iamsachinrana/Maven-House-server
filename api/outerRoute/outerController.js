require('dotenv').config();
const validatePhoneNumber = require('validate-phone-number-node-js');
let validator = require('validator');
const md5 = require('md5');

const validateData = require('../middlewares/validateData');
const translations = require('../translations');
const {
  registerUserModel, signInModel, gLoginModel,
} = require('./outerModel');

class outerController {
  welcome(req, res) {
    res.sendFile('welcome.html', { root: `${ROOT_DIR}/public` });
  };

  errors(req, res) {
    res.sendFile('error.log', { root: `${ROOT_DIR}` });
  };

  logs(req, res) {
    res.sendFile('server.log', { root: `${ROOT_DIR}` });
  };

  //register

  registerUser(req, res) {
    const validationRule = {
      "first_name": "required",
      "last_name": "required",
      "email": "required",
      "password": "required",
      "phone": "required",
    };
    validateData(req.body, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        let { first_name, last_name, email, password, phone, instagram_id, bio, wallet_address } = req.body;
        // let { filename, path } = req.file;

        /*Email Validation */
        const email_validate = {
          email: validator.isEmail(email),
          error: translations['en']['EMAIL_VALIDATION']
        }
        if (email_validate.email === false) {
          const error = email_validate.error;
          res.send({ status: 0, error: error, data: null });
          return;
        }

        /*Password Validation*/
        const validate = {
          password: { regex: /^(?=.*[A-Z])(?=.*[~!@#$%^&*()/_=+[\]{}|;:,.<>?-])(?=.*[0-9])(?=.*[a-z]).{8,14}$/, error: translations['en']['PASSWORD_VALIDATION'] }
        };
        if (!validate['password'].regex.test(password)) {
          const error = validate['password'].error;
          res.send({ status: 0, error: error, data: null });
          return;
        }

        /*Mobile Number Validation*/
        const result = validatePhoneNumber.validate(phone);
        let error = translations['en']['NUMBER_VALIDATION'];
        if (!result) {
          res.send({ status: 0, error: error, data: null });
          return;
        }

        registerUserModel(first_name, last_name, email, md5(password), phone, instagram_id, bio, wallet_address, (data, error) => {
          const response = { status: 0, data: null, error: null };
          if (data === false) {
            response.status = 0;
            response.error = error;
          } else {
            response.status = 1;
            response.data = data;
          }
          res.send(response);
        });
      }
    }).catch(err => console.log(err))
  }

  /* sigIn */
  async signIn(req, res) {
    const validationRule = {
      "email": "required",
      "password": "required",
    };
    await validateData(req.body, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        const { email, password, language } = req.body;
        signInModel(email, md5(password), language, (data, error) => {
          let response = { status: 0, data: null, error: null };
          if (data === false) {
            response.status = 0;
            response.error = error;
          } else {
            response.status = 1;
            response.data = data;
          };
          res.send(response);
        });
      }
    }).catch(err => console.log(err))
  };

  async gLogin(req, res) {
    const validationRule = {
      "token": "required"
    };
    await validateData(req.query, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        const { token, language } = req.query;
        gLoginModel(token, language, (data, error) => {
          let response = { status: 0, data: null, error: null };
          if (data === false) {
            response.status = 0;
            response.error = error;
          } else {
            response.status = 1;
            response.data = data;
          }
          res.send(response);
        });
      }
    }).catch(err => console.log(err))
  }

  async login(req, res) {
    try {
      const didToken = req.headers.authorization.substr(7);
      await magic.token.validate(didToken);
      res.status(200).json({ authenticated: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


};

module.exports = outerController;
