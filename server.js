require('dotenv').config();

const path = require('path');
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const { Console } = require('console');
const cors = require('cors');

// const sanitizeRequest = require('express-sanitize-middleware');

/* Server logs */
const output = fs.createWriteStream('./server.log', { flags: 'a' });
const errorOutput = fs.createWriteStream('./error.log', { flags: 'a' });


const logger = new Console({ stdout: output, stderr: errorOutput });

global.INFO = (...args) => logger.log(Date(), '|', 'INFO', '|', ...args);
global.ERROR = (...args) => logger.error(Date(), '|', 'ERROR', '|', ...args);

/* Global URL */
global.API_URL = require('./config').API_URL;
global.CLIENT_URL = require('./config').CLIENT_URL;

/* Global root dir */
global.ROOT_DIR = path.resolve(__dirname);

/* Create uploads directories */
require('./config').CREATE_UPLOADS_DIR();

// global.isOTPAuthenticated = async (user_id, OTP) => {
//   const response = await DBQuery(`select phone_number from user_master where  id = ${user_id}`);
//   if (response instanceof Error || response.length == 0) {
//     return false;
//   }
//   else {
//     const phone_number = response[0].phone_number;
//     const isValidated = await DBQuery(`SELECT * FROM otp_master WHERE created_at >= NOW() - INTERVAL 5 MINUTE and status = 1 and phone_number = '${phone_number}' and otp = '${OTP}'`);
//     if (isValidated instanceof Error || isValidated.length == 0) {
//       return false
//     }
//     else {
//       return true;
//     }
//   }
// };

/* Get client IP */
global.GET_IP = (req) => {
  let IP;

  const forwardedIpsStr = req.header('x-forwarded-for');

  if (forwardedIpsStr) {
    const forwardedIps = forwardedIpsStr.split(',');
    IP = forwardedIps[0];
  };

  if (!IP)
    IP = req.connection.remoteAddress;

  return IP;
};

/* Create event logs */
// global.DBLOG = (user_id, IP, action, actionOn) => {
//   const current_date = (new Date()).valueOf().toString();
//   const random = Math.random().toString();
//   const requestID = crypto.createHash('sha1').update(current_date + random).digest('hex');

//   const sql = `INSERT INTO log (user_id, action, action_on, ip, request_id) VALUES (${user_id}, '${action}', ${actionOn ? `${actionOn}` : null}, '${IP}', '${requestID}')`;

//   DBConnection.query(sql, (err) => {
//     if (err)
//       ERROR(err);
//   });
// };

/* Include all created routes */
const RoutesCustom = require('./api');

const app = express();

/* Parse application/x-www-form-urlencoded */
app.use(express.urlencoded({ extended: false }));

/* Parse application/json */
app.use(express.json({ limit: '100mb' }))
app.use(express.static('public'));
app.use(express.static('uploads'));
/* Enable cors */
const corsOptions = {
  origin: ['http://localhost:3000'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors('*'));

/*Disable Etag*/
app.set('etag', false);

// /*Disable X-powered By*/
// app.disable('x-powered-by');

/*Disable Server*/
app.set('Server', false);

// /* Serve static files */
// app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

/* Use default language in app */
app.use(function (req, res, next) {
  if (req.method === 'GET') {
    if (!req.query.hasOwnProperty('language')) {
      req.query.language = 'en';
    };
  } else if (req.method === 'POST') {
    if (!req.body.hasOwnProperty('language')) {
      req.body.language = 'en';
    };
  };

  next();
});

/* Use custom routes in app */
new RoutesCustom(app);

/* 404 middleware */
app.use(function (req, res, next) {
  res.statusCode = 404;
  res.sendFile('404.html', { root: `${ROOT_DIR}/public` });
});

/* Internal server error middleware */
app.use(function (err, req, res, next) {
  res.statusCode = 500;
  res.sendFile('500.html', { root: `${ROOT_DIR}/public` });
});


app.listen(process.env.PORT, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`🚀️ Application running on port ${process.env.PORT || 8811}`);
  };
});

