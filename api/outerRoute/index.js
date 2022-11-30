const express = require('express');
const sanitizeRequest = require('express-sanitize-middleware')({ body: true });

const upload = require('../../multer.config');

const outerController = require('./outerController');
const outer = new outerController;

const AuthenticateSession = require('../middlewares/AuthenticateSession');
const ParseData = require('../middlewares/ParseData');

const router = express.Router();

/* Static HTML */
router.get('/', outer.welcome);

/* Logs */
router.get('/errors', outer.errors);
router.get('/logs', outer.logs);

/* Register */
router.post('/register', outer.registerUser);
/*signIn*/
router.post('/signin', outer.signIn);

router.get('/google-login', outer.gLogin);



module.exports = router;
