const fs = require('fs');
const AdmZip = require('adm-zip');

async function createZipBufferFromTarZstBase64(filePathOrBase64) {
    let zipBuffer;

    if (Buffer.isBuffer(filePathOrBase64)) {
        zipBuffer = filePathOrBase64;
    } else if (filePathOrBase64.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(filePathOrBase64)) {
        // If it's Base64 string
        zipBuffer = Buffer.from(filePathOrBase64, 'base64');
    } else {
        // Assume it's a file path
        zipBuffer = fs.readFileSync(filePathOrBase64);
    }

    const zip = new AdmZip(zipBuffer);
    return zip.toBuffer();
}

module.exports = { createZipBufferFromTarZstBase64 };
