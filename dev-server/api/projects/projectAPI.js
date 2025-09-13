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

router.get("/projects/:id/projectJSON", (req, res) => {
    res.json(FetchProject(req.params.id).bs64tarzstsb3);
})

module.exports = router;