const express = require('express');

const upload = require('../../multer.config');
const AuthenticateSession = require('../middlewares/AuthenticateSession');
const ParseData = require('../middlewares/ParseData');

const router = express.Router();

const adminController = require('./adminController');
const admin = new adminController;


/* Static HTML */
router.get('/', admin.welcome);

/* Logs */
router.get('/errors', admin.errors);
router.get('/logs', admin.logs);

router.post('/verify', admin.verifyEvent);

module.exports = router;
