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

router.get('/authenticate/:address', user.authConsent);
router.post('/authenticate', user.authUser);

/*user-profile*/
router.get('/profile', user.getUser);
router.put('/profile', upload.single('profile_image'), user.updateUser);
router.delete('/profile', user.deleteUser);

/*events*/
router.post('/create-event', user.createEvent);
router.get('/get-events', user.getAllEvents);
router.get('/event', user.getEvent);
router.put('/event', user.updateEvent);
router.delete('/event', user.deleteEvent);

/*tickets*/
router.post('/ticket', user.bookTicket);
router.get('/ticket', user.getTicket);
router.get('/tickets', user.getTickets);

router.get('/join-event/:event_id/:wallet_id', user.authConsentEvent);
router.post('/join-event-authenticate', user.authenticateEvent);

/*Streaming*/
router.get('/get-user-detail', user.getUserDetail);
router.post('/create-stream', user.createStream);
router.post('/get-stream', user.getStream);


router.get('/get-storage-details', user.getStorageDetails);
router.get('/get-live-playback', user.getLivePlayBack);


/*change password*/
router.post('/change-password', user.changePassword);
router.get('/artist/:id',user.getArtist);

module.exports = router;
