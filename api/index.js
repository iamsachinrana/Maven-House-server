const outerRoute = require('./outerRoute');
const adminRoute = require('./adminRoute');
const userRoute = require('./userRoute');

class RoutesCustom {
  constructor(app) {
    app.use('/', outerRoute);
    app.use('/admin', adminRoute);
    app.use('/user', userRoute);
  };
};

module.exports = RoutesCustom;
