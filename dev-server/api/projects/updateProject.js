const express = require('express');
const router = express.Router();
const { updateProject, UpdateProjectMeta } = require("../../../src/components/projectHelper");
const { VerifyByApiToken } = require("../../../src/components/userHelper");
const { createTarZstFromZipBuffer } = require("../../../src/components/createTar");

// Route to update an existing project
router.put('/users/:username/projects/:projectId/update/contents', async (req, res) => {
    const { projectId } = req.params;
    const apiKey = req.headers['x-api-key'];
    const user = await VerifyByApiToken(apiKey);

    if (!user) 
        return res.status(403).json({ error: "Forbidden" });
    try {

        const sb3 = createTarZstFromZipBuffer(req.files.file);
        const updatedProjectId = await updateProject(projectId, sb3);
        res.json({ success: true, projectId: updatedProjectId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/users/:username/projects/:projectId/update/meta', async (req, res) => {
    const { projectId } = req.params;
    const apiKey = req.headers['x-api-key'];
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
