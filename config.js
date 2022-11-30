require('dotenv').config();

const fs = require('fs');

module.exports.API_URL = process.env.API_URL;
module.exports.CLIENT_URL = process.env.CLIENT_URL;

module.exports.CREATE_UPLOADS_DIR = () => {
  const uploadDirectories = [
    'uploads'
  ];

  for (let i = 0; i < uploadDirectories.length; i++) {
    fs.access(uploadDirectories[i], fs.constants.F_OK, (err) => {
      if (err) {
        fs.mkdir(uploadDirectories[i], { recursive: true }, (err) => {
          if (err) throw err;
        });
      };
    });
  };
};