const jwt = require('jsonwebtoken');
const { model } = require('mongoose');

module.exports = AuthenticateSession = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  console.log(req.headers['authorization']);
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];  /*Split at the space and get Token */
    req.token = bearerToken; /**set token*/
    /*verify token*/
    jwt.verify(bearerToken, process.env.TOKEN_SECRET_KEY, (err, data) => {
      if (err) {
        res.sendStatus(403);
        return;
      } else if (req.baseUrl.split('/')[1] === data.user.type.toLowerCase()) {
        if (req.method === 'GET')
          req.query.id = data.user.id;
        else if (req.method === 'POST')
          req.body.id = data.user.id;
        else if (req.method === 'PUT')
          req.body.id = data.user.id;
        else if (req.method === 'DELETE')
          req.query.id = data.user.id;
        next();
      } else {
        res.sendStatus(403);
        return;
      };
    });
  } else {
    res.sendStatus(403);
    return;
  };
}