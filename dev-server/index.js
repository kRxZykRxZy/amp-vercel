const express = require('express');
const path = require('path');
const create = require('./api/projects/createProject');
const api = require('./api/projects/projectAPI');
const signup = require('./api/users/createUser');
const session = require('./api/users/createSession');
const assets = require('./api/projects/assetAPI');
const { AddProject } = require('../src/components/projectHelper');
const { VerifyByApiToken } = require("../src/components/userHelper");
const fs = require("fs");
const AdmZip = require("adm-zip");
const tar = require("tar-stream");
const zstd = require("node-zstandard");
const projectFilePath = path.resolve(__dirname, "../example/Project.apz");
const cors = require('cors');


const app = express();
app.get('/', (req, res) => {
    res.json({ "message": "AmpMod API" });
})
app.use(express.json());
app.use(create);
app.use(api);
app.use(assets);app.use(signup);
app.use(session);

async function initialize(req, res) {
    try {
        const username = "admin";
        const apiKey = "test-api-key";
        const user = await VerifyByApiToken(apiKey);

        if (!user || user.username !== username) 
            return res.status(403).json({ error: "Forbidden" });

        // Read zip file and convert to tar in memory
        const zip = new AdmZip(projectFilePath);
        const entries = zip.getEntries();
        const pack = tar.pack();

        for (const e of entries) {
            const data = e.getData();
            pack.entry({ name: e.entryName }, data);
        }

        pack.finalize();

        // Collect tar chunks into a buffer
        const tarChunks = [];
        for await (const chunk of pack) tarChunks.push(chunk);
        const tarBuffer = Buffer.concat(tarChunks);

        // Write tar to temporary file
        const tmpTarPath = path.join(__dirname, "temp.tar");
        const tmpZstPath = path.join(__dirname, "temp.tar.zst");
        fs.writeFileSync(tmpTarPath, tarBuffer);

        // Compress using callback-based API
        await new Promise((resolve, reject) => {
            zstd.compress(tmpTarPath, tmpZstPath, 3, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Read compressed file into memory
        const tarZstBuffer = fs.readFileSync(tmpZstPath);
        const projectBase64 = tarZstBuffer.toString("base64");

        // Clean up temp files
        fs.unlinkSync(tmpTarPath);
        fs.unlinkSync(tmpZstPath);

        // Build metadata
        const meta = {
            id: '',
            title: "Untitled Project",
            description: "",
            instructions: "",
            visibility: "invisible",
            public: false,
            comments_allowed: true,
            is_published: true,
            author: {
                id: user.id,
                username: user.username,
                ampteam: false,
                history: { joined: new Date().toISOString() },
                profile: { id: null, images: { "90x90":"", "60x60":"", "55x55":"", "50x50":"", "32x32":"" } }
            },
            image: "",
            images: { "282x218":"", "216x163":"", "200x200":"", "144x108":"", "135x102":"", "100x80":"" },
            history: { created: new Date().toISOString(), modified: "", shared: "" },
            stats: { views:0, loves:0, favorites:0, remixes:0 },
            remix: { parent:null, root:null },
            project_token: (Math.random()+1).toString(36).substring(7)
        };

        const project = await AddProject(username, meta, projectBase64);

        if (res) res.json({ success: true, project });

    } catch (error) {
        console.error("Error creating project:", error);
        if (res) res.status(500).json({ error: "Failed to create project" });
    }
}

app.use(cors({
  origin: true,            // Reflects the request origin
  credentials: true        // Allows cookies to be sent
}));

module.exports = app;