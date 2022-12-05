const { getAsset, getMultipleAssets, } = require('../../utils/formatters');
const translations = require('../translations');
const validateData = require('../middlewares/validateData');
const axios = require('axios').default;
let path = require("path");
const jwt = require("jsonwebtoken");
const fs = require('fs')
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);
const md5 = require('md5');
const userModel = require('./userModel');
const user = new userModel;
let http = require('http');
const validator = require('validator');
const validatePhoneNumber = require('validate-phone-number-node-js');
const {
  welcomeUserModel
} = require('./userModel');

class userController {

  uploadAsset(req, res) {
    res.send({ data: req.file ? getAsset(req.file.filename) : null });
  };

  uploadAssets = async (req, res) => {
    const file_names = (req?.files).map(file => file.filename);
    res.send({ data: req.files ? getMultipleAssets(file_names) : null });
  };

  authUser(req, res) {
    const { address, signature } = { ...req.body };
    user.authUserModel(address, signature, (data, error) => {
      const response = { status: 0, data: null, error: null };
      if (err) {
        response.status = 0;
        response.error = error;
      } else {
        response.status = 1;
        response.data = data;
      }
      res.send()
    })
  };

  authConsent(req, res) {
    const { address } = { ...req.params };
    user.authConsentModel(address, (data, error) => {
      const response = { status: 0, data: null, error: null };
      if (err) {
        response.status = 0;
        response.error = error;
      } else {
        response.status = 1;
        response.data = data;
      }
      res.send()
    })
  };

  getUser(req, res) {
    const { id } = req.query;
    user.getUserModel(id, (data, error) => {
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

  updateUser(req, res) {
    const validationRule = {
      "id": "required",
      "first_name": "required",
      "last_name": "required",
      "phone": "required",
      "email": "required",
      "profile_image": "required"
    };
    validateData({ ...req.body, profile_image: req.file?.filename }, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        const { id, first_name, last_name, email, phone, instagram_id, bio, wallet_address } = req.body;
        const { filename, path } = req.file;

        /*email validation */
        if (req.body.email) {
          const email_validate = {
            email: validator.isEmail(email),
            error: translations['en']['EMAIL_VALIDATION']
          }
          if (email_validate.email === false) {
            const error = email_validate.error;
            res.send({ status: 0, error: error, data: null });
            return;
          }
        }

        /*Phone Number Validation*/
        const result = validatePhoneNumber.validate(phone);
        let error = translations['en']['NUMBER_VALIDATION'];
        if (!result) {
          res.send({ status: 0, error: error, data: null });
          return;
        }

        user.updateUserModel(id, first_name, last_name, email, phone, instagram_id, bio, wallet_address, filename, path, (data, error) => {
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

  deleteUser(req, res) {
    const { id } = req.query;
    user.deleteUserModel(id, (data, error) => {
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

  createEvent(req, res) {
    const validationRule = {
      "name": "required",
      "type": "required",
      "category": "required",
      "ticket_amount": "required",
      "date": "required",
      "total_tickets": "required",
      "short_description": "required",
      "long_description": "required",
      "ticket_image": "required",
      "gallery": "required",
      "link": "required",
      "host": "required",
      "location": "required"
    };
    validateData({ ...req.body }, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        const { id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages } = req.body;
        user.createEventModel(id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages, (data, error) => {
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
    }).catch(err => console.log(err));
  }

  getAllEvents(req, res) {

    const { id, search } = req.query;
    user.getAllEventsModel(id, search, (data, error) => {
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

  getEvent(req, res) {
    const { id, event_id } = req.query;
    user.getEventModel(id, event_id, (data, error) => {
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

  updateEvent(req, res) {
    const validationRule = {
      "event_id": "required",
      "name": "required",
      "type": "required",
      "category": "required",
      "ticket_amount": "required",
      "date": "required",
      "total_tickets": "required",
      "short_description": "required",
      "long_description": "required",
      "ticket_image": "required",
      "gallery": "required",
      "link": "required",
      "host": "required",
      "location": "required"
    };
    validateData({ ...req.body }, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        const { id, event_id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages } = req.body;

        user.updateEventModel(id, event_id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages, (data, error) => {

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
    }).catch(err => console.log(err));
  }

  deleteEvent(req, res) {
    const { id, event_id } = req.query;
    user.deleteEventModel(id, event_id, (data, error) => {
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

  bookTicket(req, res) {
    const validationRule = {
      "id": "required",
      "event_id": "required",
      "tickets": "required",
      "unit_price": "required",
      "service_fee": "required",
    };
    validateData({ ...req.body }, validationRule, {}, (err, status) => {
      if (!status) {
        res.status(412)
          .send({
            success: false,
            message: 'Validation failed',
            data: null,
            error: err
          });
      } else {
        const { id, event_id, tickets, unit_price, service_fee } = req.body;

        user.bookTicketModel(id, event_id, tickets, unit_price, service_fee, (data, error) => {

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
    }).catch(err => console.log(err));
  }

  getTicket(req, res) {
    const { id, ticket_id, event_id } = req.query;
    user.getTicketModel(id, ticket_id, event_id, (data, error) => {
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

  getTickets(req, res) {
    const { id, search } = req.query;
    user.getTicketsModel(id, search, (data, error) => {
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

  async changePassword(req, res) {
    const validationRule = {
      "id": "required",
      "oldPassword": "required",
      "newPassword": "required",
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
        const { id, oldPassword, newPassword, confirmPassword } = req.body;
        if (newPassword === confirmPassword) {
          user.changePasswordModel(id, oldPassword, md5(newPassword), (data, error) => {
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
        } else {
          res.send('Please confirm password...');
        }
      }
    }).catch(err => console.log(err))
  };
};

module.exports = userController;
