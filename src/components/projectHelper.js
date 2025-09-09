const { query } = require("../config/sql");

// fetch full project row
const FetchProject = async (id) => {
    const result = await query(
        "SELECT * FROM Projects WHERE id = @id",
        { id }
    );
    return result.recordset[0]; // return the full sql table data of it
};

// fetch only the bs64 tar.zst file
const FetchProjectFiles = async (id) => {
    const result = await query(
        "SELECT bs64tarzstsb3 FROM Projects WHERE id = @id",
        { id }
    );
    return result.recordset; // return the bs64 tar.zst file
};

// update only the bs64 tar.zst file of an existing project
const UpdateProject = async (id, fileBuffer) => {
    const result = await query(
        `UPDATE Projects 
         SET bs64tarzstsb3 = @bs64tarzstsb3 
         OUTPUT INSERTED.id 
         WHERE id = @id`,
        {
            id,
            bs64tarzstsb3: fileBuffer
        }
    );
    return result.recordset[0]?.id; // return updated project ID
};

// insert new project and return its id
const AddProject = async (author, data, fileBuffer) => {
    const id = await query("SELECT id FROM Projects WHERE id = (SELECT MAX(id) FROM Projects)");
    const meta = data.id = id.recordset[0] ? id.recordset[0].id + 1 : 1; // if no projects exist, start at 1
    const result = await query(
        `INSERT INTO Projects (id, author, projectMETA, bs64tarzstsb3)
         OUTPUT INSERTED.id
         VALUES (id, @author, @projectMETA, @bs64tarzstsb3)`,
        {
            id: id.recordset[0] ? id.recordset[0].id + 1 : 1, // if no projects exist, start at 1
            author,
            projectMETA: meta,            
            bs64tarzstsb3: fileBuffer     
        }
    );
    return result.recordset[0].id; // return new project ID
};

module.exports = { FetchProject, FetchProjectFiles, AddProject, UpdateProject };

