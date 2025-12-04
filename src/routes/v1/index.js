const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const apartmentRoute = require('./apartment.route');
const roomRoute = require('./room.route');
const customerRoute = require('./customer.route');
const invoiceRoute = require('./invoice.route');
const notificationRoute = require('./notification.route');
const fileManagerRoute = require('./fileManager.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/apartments',
    route: apartmentRoute,
  },
  {
    path: '/rooms',
    route: roomRoute,
  },
  {
    path: '/customers',
    route: customerRoute,
  },
  {
    path: '/invoices',
    route: invoiceRoute,
  },
  {
    path: '/notifications',
    route: notificationRoute,
  },
  {
    path: '/file-manager',
    route: fileManagerRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
