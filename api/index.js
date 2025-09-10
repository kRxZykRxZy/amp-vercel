const express = require('express');
const app = express();

// Example endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'ok' });
});

module.exports = app;
