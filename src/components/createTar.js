const AdmZip = require('adm-zip');
const tar = require('tar-stream');
const { compress } = require('node-zstandard');
const base64 = require('base64-js');

// Function to create a tar.zst from a zip file buffer
const createTarZstFromZipBuffer = async (zipBuffer) => {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    const pack = tar.pack();
    entries.forEach(e => {
        const data = e.getData();
        pack.entry({ name: e.entryName }, data);
    });
    pack.finalize();
    const tarChunks = [];
    for await (const chunk of pack) tarChunks.push(chunk);
    const tarBuffer = Buffer.concat(tarChunks);
    const tarZstBuffer = await compress(tarBuffer, 3);
    return tarZstBuffer.toString("base64");
}

module.exports = { createTarZstFromZipBuffer };