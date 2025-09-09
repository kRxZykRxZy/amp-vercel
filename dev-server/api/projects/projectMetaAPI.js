const express = require("express");
const router = express.Router();
const { FetchProject } = require("../../../src/components/projectHelper");

// get project metadata
router.get("/projects/:id", async (req, res) => {
    const projectId = req.params.id;
    try {
        const projectsql = await FetchProject(projectId);
        const meta = JSON.parse(projectsql.projectMETA.replace(/\\/g, ""));
        meta.id = projectId;
        const metanew = meta;
        if (!metanew.ispublished) {
            res.json({ error: "Project not found" });
        }
        res.json(metanew);
    } catch (error) {
        console.error("Error fetching project meta:", error);
        res.status(500).json({ error: "Project not found"});
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
        res.json(metanew);
    } catch (error) {
        console.error("Error fetching project meta:", error);
        res.status(500).json({ error: "Project not found" });
    }
});

module.exports = router;