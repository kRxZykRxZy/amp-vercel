const express = require('express');
const router = express.Router();
const { updateProject, UpdateProjectMeta, FetchProject } = require("../../../src/components/projectHelper");
const { VerifyByApiToken } = require("../../../src/components/userHelper");
const { createTarZstFromZipBuffer } = require("../../../src/components/createTar");

// Route to update an existing project
router.put('/:id', async (req, res) => {
    const projectId = req.params.id;
    const apiKey = req.cookies?.scratchsessionsid;
    if (!apiKey) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await VerifyByApiToken(apiKey);
    const project = FetchProject(projectId);
    const meta = project.meta;
    if(req.query.title) {
        meta.title = req.query.title;
        UpdateProjectMeta(projectId, meta);
    }
    if(project?.meta?.author?.username == user) {
        return res.json({ error: "Invalid Key" });
    }

    if (!user) 
        return res.status(403).json({ error: "Forbidden" });
    try {

        const sb3 = createTarZstFromZipBuffer(req.files.file);
        const updatedProjectId = await updateProject(projectId, req.body);
        res.json({ success: true, projectId: updatedProjectId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/users/:username/projects/:projectId/update/meta', async (req, res) => {
    const { projectId } = req.params;
    const apiKey = req.cookies?.scratchsessionsid;
    const user = await VerifyByApiToken(apiKey);
    if (!user) 
        return res.status(403).json({ error: "Forbidden" });
    try {
        const meta = req.body;
        const updatedMeta = await UpdateProjectMeta(projectId, meta);
        res.json({ success: true, meta: updatedMeta });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

module.exports = router;
