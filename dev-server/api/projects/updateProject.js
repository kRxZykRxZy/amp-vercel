const express = require('express');
const router = express.Router();
const { updateProject } = require("../../../src/components/projectHelper");
const { createTarZstFromZipBuffer } = require("../../../src/components/createTar");

// Route to update an existing project
router.put('/users/:username/projects/:projectId/update/contents', async (req, res) => {
    const { projectId } = req.params;
    try {
        const sb3 = createTarZstFromZipBuffer(req.files.file);
        const updatedProjectId = await updateProject(projectId, sb3);
        res.json({ success: true, projectId: updatedProjectId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
