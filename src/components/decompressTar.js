const AdmZip = require('adm-zip');
const tar = require('tar-stream');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { decompress } = require('node-zstandard');

const createZipBufferFromTarZstBase64 = async (base64TarZst) => {
const tarZstBuffer = Buffer.from(base64TarZst, 'base64');
const tempZstPath = path.join(os.tmpdir(), `temp-${Date.now()}.tar.zst`);
const tempTarPath = tempZstPath.replace('.tar.zst', '.tar');
fs.writeFileSync(tempZstPath, tarZstBuffer);
await decompress(tempZstPath, tempTarPath);
const tarBuffer = fs.readFileSync(tempTarPath);
const extract = tar.extract();
const zip = new AdmZip();
await new Promise((resolve, reject) => {
extract.on('entry', (header, stream, next) => {
const chunks = [];
stream.on('data', (chunk) => chunks.push(chunk));
stream.on('end', () => {
zip.addFile(header.name, Buffer.concat(chunks));
next();
});
stream.on('error', reject);
});
extract.on('finish', resolve);
extract.on('error', reject);
extract.end(tarBuffer);
});
fs.unlinkSync(tempZstPath);
fs.unlinkSync(tempTarPath);
return zip.toBuffer();
};

module.exports = { createZipBufferFromTarZstBase64 };
