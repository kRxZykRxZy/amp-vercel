const express = require('express');
const router = express.Router();
const { updateProject } = require("../../../src/components/projectHelper");
const { createTarZstFromZipBuffer } = require("../../../src/components/createTar");

// Route to update an existing project
router.put('/users/:username/projects/:projectId/update/contents', async (req, res) => {
    const { projectId } = req.params;
    const sb3 = req.files;
    try {
        const updatedProjectId = await updateProject(projectId, sb3);
        res.json({ "id": projectId });
    }
});