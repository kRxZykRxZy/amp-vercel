const { query } = require("../config/sql");

// fetch full project row
const FetchProject = async (id) => {
    const rows = await query(
        "SELECT * FROM Projects WHERE id = ?",
        [id]
    );
    return rows[0] || null; // return null if not found
};

// fetch only the bs64 tar.zst file
const FetchProjectFiles = async (id) => {
    const rows = await query(
        "SELECT bs64tarzstsb3 FROM Projects WHERE id = ?",
        [id]
    );
    return rows[0]?.bs64tarzstsb3 || null;
};

// update only the bs64 tar.zst file of an existing project
const UpdateProject = async (id, fileBuffer) => {
    const result = await query(
        `UPDATE Projects 
         SET bs64tarzstsb3 = ? 
         WHERE id = ?`,
        [fileBuffer, id]
    );
    return result.changes || 0; // return number of rows updated
};

// insert new project and return its id
const AddProject = async (author, data, fileBuffer) => {
    const result = await query(
        `INSERT INTO Projects (author, projectMETA, bs64tarzstsb3)
         VALUES (?, ?, ?)`,
        [author, JSON.stringify(data), fileBuffer]
    );
    return result.lastID; // return the newly inserted ID
};

const UpdateProjectMeta = async (id, newMeta) => {
    const project = await FetchProject(id);
    if (!project) throw new Error("Project not found");
    const currentMeta = JSON.parse(project.projectMETA || '{}');
    const updatedMeta = { ...currentMeta, ...newMeta };
    await query("UPDATE Projects SET projectMETA = ? WHERE id = ?", [JSON.stringify(updatedMeta), id]);
    return updatedMeta;
};

module.exports = { UpdateProjectMeta, FetchProject, FetchProjectFiles, AddProject, UpdateProject };
