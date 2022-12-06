const express = require('express');

const AuthenticateSession = require('../middlewares/AuthenticateSession');
const ParseData = require('../middlewares/ParseData');
const upload = require('../../multer.config');
const router = express.Router();

const userController = require('./userController');
const user = new userController;

/* USER ROUTES */
router.post('/upload-asset', upload.single('asset'), user.uploadAsset);
router.post('/upload-multiple-assets', upload.array('asset', 10), user.uploadAssets);

router.post('/authenticate', user.authUser);
router.get('/authenticate/:address', user.authConsent);

/*user-profile*/
router.get('/profile', user.getUser);
router.put('/profile', upload.single('profile_image'), user.updateUser);
router.delete('/profile', user.deleteUser);

/*events*/
router.post('/event', user.createEvent);
router.get('/events', user.getAllEvents);
router.get('/event', user.getEvent);
router.put('/event', user.updateEvent);
router.delete('/event', user.deleteEvent);

/*tickets*/
router.post('/ticket', user.bookTicket);
router.get('/ticket', user.getTicket);
router.get('/tickets', user.getTickets);

/*Streaming*/
router.get('/get-user-detail', user.getUserDetail);
router.post('/create-stream', user.createStream);
router.post('/get-stream', user.getStream);

/*change password*/
router.post('/change-password', user.changePassword);

module.exports = router;
