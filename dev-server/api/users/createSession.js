const express = require("express");
const router = express.Router();
const { verifyUser, generateApiToken, VerifyByApiToken } = require("../../../src/components/userHelper");

router.post("/users/:username/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    try {
        const user = await verifyUser(username, password);
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        const apiToken = await generateApiToken(user.id);
        res.cookie("scratchsessionsid", apiToken, {
            httpOnly: true,       // Cannot be accessed by client-side JS
            secure: false,        // Send even over HTTP
            sameSite: "Strict",   // Prevent CSRF
            maxAge: 1000 * 60 * 60 * 24 * 3 // 3 days in milliseconds
        });
        res.json({ apiToken });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/session", async (req, res) => {
    const ssid = req.cookies.scratchsessionsid;
    const user = await VerifyByApiToken(ssid);
    res.json(user);
});

module.exports = router;
    