const express = require('express');
const path = require('path');
const create = require('./api/projects/createProject');
const api = require('./api/projects/projectMetaAPI');
const signup = require('./api/users/createUser');
const session = require('./api/users/createSession');

const app = express();
app.get('/', (req, res) => {
    res.json({ "message": "AmpMod API" });
})
app.use(express.json());
app.use(create);
app.use(api);
app.use(signup);
app.use(session);

module.exports = app;