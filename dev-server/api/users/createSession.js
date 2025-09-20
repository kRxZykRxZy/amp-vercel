const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const { verifyUser, generateApiToken, VerifyByApiToken } = require("../../../src/components/userHelper");

router.use(cookieParser());

router.post("/users/:username/login", async (req, res) => {
    const username = req.params.username;
    const { password } = req.body;

    // Validation errors
    const errors = {};
    if (!username) errors.username = "Username is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const user = await verifyUser(username, password);
        if (!user) {
            return res.status(401).json({ errors: { auth: "Invalid username or password" } });
        }

        const apiToken = await generateApiToken(user);
        res.cookie("scratchsessionsid", apiToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
        });

        return res.json({ apiToken });
    } catch (error) {
        console.error("Error during login:", error);
        // Include the error message in development, generic in production
        const message =
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : error.message || "Unknown error";

        return res.status(500).json({ errors: { server: message } });
    }
});


router.get("/session", async (req, res) => {
    try {
        const ssid = req.body.apiToken;
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
