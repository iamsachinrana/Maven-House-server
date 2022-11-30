require('dotenv').config();

const jwt = require('jsonwebtoken');

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

module.exports = UpdateAuthenticateSession = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;

    // Verify token
    jwt.verify(bearerToken, process.env.TOKEN_SECRET_KEY, (err, data) => {
      if (err) {
        DBLOG(-1, GET_IP(req), 'end-user-session');
        res.sendStatus(403);
        return;
      } else {
        const user = {
          id: data.user.id,
          type: data.user.type,
          status: data.user.status
        };

        if (user.type === 'AGENCY') {
          user['agencyID'] = data.user.agencyID;
        }

        jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1200000' }, (err, token) => {
          if (err) {
            res.sendStatus(403);
            return;
          }
          else {
            DBQuery(`INSERT INTO blacklisted_JWT (JWT) VALUES ('${bearerToken}')`);

            res.send({
              id: user.id,
              token,
              status: user.status,
              type: user.type
            });
            return;
          };
        });
      };
    });
  } else {
    res.sendStatus(403);
    return;
  };
}
