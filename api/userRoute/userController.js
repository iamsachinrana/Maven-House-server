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
const CID = require('cids')
const {
 storeFiles, getFilesToUpload,
} = require('../../web3');

class userController {

  uploadAsset(req, res) {
    res.send({ data: req.file ? getAsset(req.file.filename) : null });
  };

  uploadAssets = async (req, res) => {
    const file_names = (req?.files).map(file => file.filename);
    res.send({ data: req.files ? getMultipleAssets(file_names) : null });
  };

  authUser(req, res) {
    const { address, signature } = req.body;
    user.authUserModel(address, signature, (data, error) => {
      const response = { status: 0, data: null, error: null };
      if (data === false) {
        response.status = 0;
        response.error = error;
      } else {
        response.status = 1;
        response.data = data;
      }
      res.send(response);
    })
  };

  authConsent(req, res) {
    const { address } = req.params;
    user.authConsentModel(address, (data, error) => {
      const response = { status: 0, data: null, error: null };
      if (data === false) {
        response.status = 0;
        response.error = error;
      } else {
        response.status = 1;
        response.data = data;
      }
      res.send(response);
    })
  };

  authenticateEvent(req, res) {
    const { event_id, address, signature } = req.body;
    user.authenticateEventModel(event_id, address, signature, (data, error) => {
      const response = { status: 0, data: null, error: null };
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
  authConsentEvent(req, res) {
    const { event_id, wallet_id } = req.params;
    user.authConsentEventModel(event_id, wallet_id, (data, error) => {
      const response = { status: 0, data: null, error: null };
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

  uploadToWebStorage =async  (file) => {
     return storeFiles(await getFilesToUpload(file),  {wrapWithDirectory: false})
  }

   uploadToIpfs =async (req, res) => {
    if (!req.file) {
      return res.end(400);
    } else {
      const cid = await this.uploadToWebStorage(`uploads/${req.file.filename}`);
      res.send({cid})
    }
  }

  createEvent(req, res) {
    const validationRule = {
      "name": "required",
      "type": "required",
      "category": "required",
      "ticket_amount": "required",
      "total_tickets": "required",
      "short_description": "required",
      "long_description": "required",
      "ticket_image": "required",
      "gallery": "required",
      "teaser_playback": "required",
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

        // console.log("call")
        const user_id = 65;
        const { name, type, category, ticket_amount, start_date, end_date, total_tickets, short_description, long_description, ticket_image, gallery, teaser_playback, host, location } = req.body;
        user.createEventModel(user_id, name, type, category, ticket_amount, start_date, end_date, total_tickets, short_description, long_description, ticket_image, gallery, teaser_playback, host, location, (data, error) => {
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

  getUserDetail(req, res) {
    const { language } = req.query;
    const id = 65;
    user.getUserDetailModel(id, language, (data, error) => {
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

  createStream(req, res) {
    const { user_id, api_key, language } = req.body;

    user.createStreamModel(user_id, api_key, language, (data, error) => {
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

  getStream(req, res) {
    const { language, api_key, stream_id } = req.body;
    const authorizationHeader = req.headers && req.headers["authorization"];
    user.getStreamModel(authorizationHeader, api_key, stream_id, language, (data, error) => {
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

  getStorageDetails(req, res) {

    user.getStorageDetails((data, error) => {
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

  getLivePlayBack(req, res) {
    const { language, user_id } = req.query;
    user.getLivePlayBackModel(language, user_id, (data, error) => {
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
  getArtist(req,res){
    const { id } = req.params;
    const {language} = req.query;
    user.getArtistDetails(id,language, (data, error) => {
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
  sendNotification(req, res) {
    const { message,link } = req.body;
    const {language} = req.query;
    user.sendPushNotification(message,link,language, (data, error) => {
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
};

module.exports = userController;
