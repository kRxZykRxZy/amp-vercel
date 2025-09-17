const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const { verifyUser, generateApiToken, VerifyByApiToken } = require("../../../src/components/userHelper");

router.use(cookieParser());

router.post("/users/:username/login", async (req, res) => {
    const username = req.params.username;
    const { password } = req.body;

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
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 1000 * 60 * 60 * 24 * 3
        });

        res.json({ apiToken });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/session", async (req, res) => {
    try {
        const ssid = req.cookies.scratchsessionsid;
        if (!ssid) return res.status(401).json({ error: "No session" });

        const user = await VerifyByApiToken(ssid);
        if (!user) return res.status(401).json({ error: "Invalid session" });

        res.json(user);
    } catch (error) {
        console.error("Error verifying session:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
