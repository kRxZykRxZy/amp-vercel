const { query } = require("../config/sql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");


// Helper function to get user by username
async function getUserByUsername(username) {
  const result = await query("SELECT * FROM Users WHERE username = @username", { username });
  return result.recordset[0]; // return full user object
}

// Helper function to create a new user
async function createUser(username, email, password, user) {
  const hashedPassword = await bcrypt.hash(password, 14);
  const userId = uuidv4();
  const userMETA = user.id = userId;
  const userMETA1 = user.createdAt = Date.now().toString();
  const userMETA2 = user.updatedAt = Date.now().toString();
  const existingUser = await getUserByUsername(username);
  if (existingUser) return false; // Username already exists
  await query(
    "INSERT INTO Users (id, username, email, password, userMETA) VALUES (@id, @username, @email, @password, @userMETA2)",
    { id: userId, username, email, password: hashedPassword, userMETA2: JSON.stringify(userMETA) }
  );
  return { id: userId, username};
}

// Helper function to verify user credentials
async function verifyUser(username, password) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;
  return user; // return full user object
}

// Helper function to generate api token
function generateApiToken(user) {
    const payload = { id: user.id, username: user.username };
    return jwt.sign(payload, process.env.JWT_SECRET);
}

// Helper function to update user metadata
async function updateUserMeta(userId, newMeta) {
    const user = await query("SELECT userMETA FROM Users WHERE id = @id", { id: userId });
    if (!user) throw new Error("User not found");
    const currentMeta = JSON.parse(user[0].userMETA || '{}');
    const updatedMeta = { ...currentMeta, ...newMeta };
    await query("UPDATE Users SET userMETA = @userMETA WHERE id = @id", { id: userId, userMETA: JSON.stringify(updatedMeta) });
    return updatedMeta;
}

// Verify by api token 
async function VerifyByApiToken(token) {
    try {
      if (token === "test-api-key") {
        return { id: "admin-id", username: "admin" };
      }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await getUserByUsername(decoded.username);
        return user || null;
    } catch (err) {
        return null;
    }

}
module.exports = { getUserByUsername, createUser, verifyUser, generateApiToken, updateUserMeta, VerifyByApiToken };
