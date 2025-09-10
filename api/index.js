// Import the app from /dev-server/index.js
const app = require('../dev-server/index.js');

// Run the app
const PORT = process.env.PORT || 3000;

module.exports = app;
