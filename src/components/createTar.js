const AdmZip = require('adm-zip');
const tar = require('tar-stream');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { compress } = require('node-zstandard');

const createTarZstFromZipBuffer = async (zipBuffer) => {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    const pack = tar.pack();

    // Add entries to tar
    for (const e of entries) {
        const data = e.getData();
        await new Promise((resolve, reject) => {
            pack.entry({ name: e.entryName }, data, (err) => (err ? reject(err) : resolve()));
        });
    }

    pack.finalize();

    // Create temp tar file
    const tempTarPath = path.join(os.tmpdir(), `temp-${Date.now()}.tar`);
    const tarStream = fs.createWriteStream(tempTarPath);
    await new Promise((resolve, reject) => {
        pack.pipe(tarStream)
            .on('finish', resolve)
            .on('error', reject);
    });

    // Create temp zst file
    const tempZstPath = path.join(os.tmpdir(), `temp-${Date.now()}.tar.zst`);
    await compress(tempTarPath, tempZstPath, 3);

    // Read compressed file and return Base64
    const tarZstBuffer = fs.readFileSync(tempZstPath);

    // Clean up temp files
    fs.unlinkSync(tempTarPath);
    fs.unlinkSync(tempZstPath);

    return tarZstBuffer.toString('base64');
};

module.exports = { createTarZstFromZipBuffer };
