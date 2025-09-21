const express = require("express");
const router = express.Router();
const { FetchProject, FetchProjectFiles } = require("../../../src/components/projectHelper");
const { createZipBufferFromTarZstBase64 } = require('../../../src/components/decompressTar');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

// get project metadata
router.get("/projects/:id", async (req, res) => {
    const projectId = req.params.id;
    try {
        const projectsql = await FetchProject(projectId);
        const meta = JSON.parse(projectsql.projectMETA.replace(/\\/g, ""));
        meta.id = projectId;
        const metanew = meta;
        if (!metanew.ispublished) {
            return res.json({ error: "Project not found" });
        }
        return res.json(metanew);
    } catch (error) {
        console.error("Error fetching project meta:", error);
        return res.status(500).json({ error: "Project not found"});
    }
});

// get project metadata
router.get("/users/:username/projects/:id", async (req, res) => {
    const projectId = req.params.id;
    try {
        const projectsql = await FetchProject(projectId);
        const meta = JSON.parse(projectsql.projectMETA.replace(/\\/g, ""));
        meta.id = projectId;
        const metanew = meta;
        if (!metanew.ispublished) {
            return res.json({ error: "Project not found" });
        }
        return res.json(metanew);
    } catch (error) {
        console.error("Error fetching project meta:", error);
        return res.status(500).json({ error: "Project not found" });
    }
});

router.get("/json/:id", async (req, res) => {
    const projectId = req.params.id;

    try {
        // 1. Fetch project files (tar.zst base64)
        const projectFilesBase64 = await FetchProjectFiles(projectId);
        if(!projectFilesBase64) {
            res.json({"error": })
        }

        // 2. Convert to ZIP buffer (using your existing decompress function)
        const zipBuffer = await createZipBufferFromTarZstBase64(projectFilesBase64);

        // 3. Load ZIP in memory
        const zip = new AdmZip(zipBuffer);

        // 4. Extract project.json entry
        const projectEntry = zip.getEntry("project.json");
        if (!projectEntry) {
            return res.status(404).json({ error: "project.json not found in project files" });
        }

        // 5. Read project.json as string and parse
        const projectJsonStr = projectEntry.getData().toString("utf-8");
        const projectJson = JSON.parse(projectJsonStr);

        // 6. Return as JSON
        return res.json(projectJson);
    } catch (error) {
        console.error("Error extracting project.json:", error);
        return res.status(500).json({ error: "Failed to fetch project.json from project files" });
    }
});

router.get("/assets/:md5ext", async (req, res) => {
    const md5ext = req.params.md5ext.toLowerCase(); // e.g., "d41d8cd98f00b204e9800998ecf8427e.png"

    try {
        // 1. Fetch all projects from the Projects table
        const projects = await query("SELECT id, bs64tarzstsb3 FROM Projects");

        let foundFile = null;
        let foundFileName = null;

        // 2. Loop through each project
        for (const project of projects) {
            const base64Files = project.bs64tarzstsb3;
            if (!base64Files) continue;

            // 3. Convert project files to ZIP buffer
            const zipBuffer = await createZipBufferFromTarZstBase64(base64Files);
            const zip = new AdmZip(zipBuffer);

            // 4. Iterate over files in ZIP
            for (const entry of zip.getEntries()) {
                if (entry.isDirectory) continue;

                const data = entry.getData();
                const hash = crypto.createHash("md5").update(data).digest("hex");
                const ext = entry.entryName.split('.').pop();

                if (`${hash}.${ext}`.toLowerCase() === md5ext) {
                    foundFile = data;
                    foundFileName = entry.entryName;
                    break;
                }
            }

            if (foundFile) break;
        }

        if (!foundFile) {
            return res.status(404).json({ error: "Asset not found" });
        }

        // 5. Set MIME type based on extension (including SVG)
        const ext = foundFileName.split(".").pop().toLowerCase();
        let contentType = "application/octet-stream";
        switch (ext) {
            case "png":
                contentType = "image/png";
                break;
            case "jpg":
            case "jpeg":
                contentType = "image/jpeg";
                break;
            case "gif":
                contentType = "image/gif";
                break;
            case "svg":
                contentType = "image/svg+xml";
                break;
        }

        res.set({
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${foundFileName}"`
        });

        return res.send(foundFile);
    } catch (error) {
        console.error("Error fetching asset:", error);
        return res.status(500).json({ error: "Failed to fetch asset" });
    }
});
    

module.exports = router;