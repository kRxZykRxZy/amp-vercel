const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const sqlite3 = require("sqlite3").verbose();

const SERVER_URL = "https://krxzy.pythonanywhere.com";
const FILE_NAME = "localdb.txt";
const LOCAL_PATH = path.join(__dirname, FILE_NAME);

async function query(sql, params = {}) {
  if (!fs.existsSync(LOCAL_PATH)) {
    try {
      const res = await axios.get(`${SERVER_URL}/files/${FILE_NAME}`, { responseType: "arraybuffer" });
      fs.writeFileSync(LOCAL_PATH, res.data);
    } catch (err) {
      console.log("Failed to download database. Creating a new one...", err);
      await createLocalDatabase();
      await uploadDatabase();
    }
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(LOCAL_PATH);
    const isSelect = sql.trim().toUpperCase().startsWith("SELECT");

    if (isSelect) {
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    } else {
      db.run(sql, params, async function (err) {
        db.close();
        if (err) return reject(err);
        await uploadDatabase();
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

async function createLocalDatabase() {
  const db = new sqlite3.Database(LOCAL_PATH);
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS Projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          author TEXT,
          projectMETA TEXT,
          bs64tarzstsb3 TEXT
        );`
      );

      db.run(`
        CREATE TABLE IF NOT EXISTS Users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE,
          email TEXT,
          password TEXT,
          userMETA TEXT
        );`, (err) => {
          if (err) return reject(err);
          resolve();
        });
    });
  });
  db.close();
}

async function uploadDatabase() {
  const form = new FormData();
  form.append("file", fs.createReadStream(LOCAL_PATH));

  try {
    await axios.post(`${SERVER_URL}/upload`, form, { headers: form.getHeaders() });
  } catch (err) {
    console.error("Failed to upload database:", err);
  }
}

module.exports = { query };
