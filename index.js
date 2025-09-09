const serverless = require('serverless-http');
const app = require('/dev-server/index'); // import Express from dev-server

module.exports = app;
module.exports.handler = serverless(app);
