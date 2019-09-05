'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');

// Import Database via Sequelize
const { sequelize } = require('./db');

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// JSON Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Testing Database Connectiton
(async () => {
  try {
    console.log(`Testing database connection...`);
    await sequelize.authenticate();
    console.log(`Database connection successful!`);
  }catch(err){
    console.error(`Unable to connect to database => `, err);
  }
})();

// Routes
  // Index Route
  const index = require('./routes');
  app.use('/', index);

  // // API Routes
  const apiRoutes = require('./routes/api');
  app.use('/api', apiRoutes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Application running on PORT ${server.address().port}! :)`);
});
