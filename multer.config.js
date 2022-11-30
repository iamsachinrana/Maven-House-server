const multer = require('multer');
const crypto = require('crypto');
const uuid = require('uuid').v4;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const hash = crypto.createHash('md5').update(file.originalname + uuid() + Date.now() + Math.floor((Math.random() + 1) * 100000)).digest('hex');

    if (!file.originalname.includes('.')) {
      cb(null, hash);
    } else {
      const regExpMatchArray = file.originalname.match(/[a-z0-9]+$/);
      if (regExpMatchArray) {
        cb(null, hash + '.' + regExpMatchArray[0]);
      } else {
        cb(null, hash);
      }
    }
  }
});

module.exports = multer({ storage: storage });