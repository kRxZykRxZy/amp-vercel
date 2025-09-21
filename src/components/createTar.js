const fs = require('fs');
const path = require('path');

const createTarBase64FromZipBuffer = (filePath) => {
    const absolutePath = path.resolve(filePath);
    const fileBuffer = fs.readFileSync(absolutePath);
    return fileBuffer.toString('base64');
};

module.exports = { createTarBase64FromZipBuffer };
