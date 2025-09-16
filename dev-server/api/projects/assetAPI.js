const express = require('express'),
    router = express.Router(),
    {
        query
    } = require('../../../src/config/sql');
query(`CREATE TABLE IF NOT EXISTS Assets(id INTEGER PRIMARY KEY AUTOINCREMENT,md5 TEXT UNIQUE,ext TEXT,type TEXT,data BLOB,createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
router.post('/internalapi/asset/:md5ext/', async(req, res) => {
    const {
        md5,
        ext,
        type,
        data
    } = req.body;
    if (!md5 || !ext || !data) return res.status(400).json({
        error: 'md5,ext,data required'
    });
    await query('INSERT OR IGNORE INTO Assets(md5,ext,type,data) VALUES(?,?,?,?)', [md5, ext, type || null, Buffer.from(data, 'base64')]);
    res.json({
        success: true,
        assetId: md5
    });
});
router.get('/internalapi/asset/:md5/get/', async(req, res) => {
    const rows = await query('SELECT * FROM Assets WHERE md5=?', [req.params.md5]);
    if (!rows.length) return res.status(404).json({
        error: 'Asset not found'
    });
    res.setHeader('Content-Type', rows[0].ext === 'png' ? 'image/png' : rows[0].ext === 'jpg' || rows[0].ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream');
    res.send(rows[0].data);
});
module.exports = router;