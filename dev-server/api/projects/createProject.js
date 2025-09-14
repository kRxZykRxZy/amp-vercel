const express = require("express");
const router = express.Router();
const { AddProject } = require('../../../src/components/projectHelper');
const { VerifyByApiToken } = require("../../../src/components/userHelper");
const { remixProject } = require("../../../components/remixProject");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const tar = require("tar-stream");
const { compress } = require("node-zstandard");

const projectFilePath = path.resolve(__dirname, "../../../example/Project.apz");

router.post("/", async (req, res) => {
    try {
        const apiKey = req.cookies?.scratchsessionsid;
        if(req.query.isRemix) {
            remixProject(req.query.originalId);
        }
        const user = await VerifyByApiToken(apiKey);
        const username = user.username;

        if (!user || user.username !== username) 
            return res.status(403).json({ error: "Forbidden" });

        // Read zip file and convert to tar.zst
        const zip = new AdmZip(projectFilePath);
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
        const projectBase64 = tarZstBuffer.toString("base64");

        // Build metadata
        const meta = JSON.stringify({
            id: '',
            title: "Untitled Project",
            description: "",
            instructions: "",
            visibility: "invisible",
            public: false,
            comments_allowed: true,
            is_published: false,
            author: {
                id: user.id,
                username: user.username,
                ampteam: false,
                history: {
                    joined: new Date().toISOString()
                },
                profile: {
                    id: null,
                    images: {
                        "90x90": "",
                        "60x60": "",
                        "55x55": "",
                        "50x50": "",
                        "32x32": ""
                    }
                }
            },
            image: "",
            images: {
                "282x218": "",
                "216x163": "",
                "200x200": "",
                "144x108": "",
                "135x102": "",
                "100x80": ""
            },
            history: {
                created: new Date().toISOString(),
                modified: "",
                shared: ""
            },
            stats: {
                views: 0,
                loves: 0,
                favorites: 0,
                remixes: 0
            },
            remix: {
                parent: null,
                root: null
            },
            project_token: (Math.random() + 1).toString(36).substring(7)
        });

        const project = await AddProject(username, meta, req.body);
        if (!project) return res.status(500).json({ error: "Failed to create project" });

        res.status(201).json({ "id": project.id, "content-name": project.id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
