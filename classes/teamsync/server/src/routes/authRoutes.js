const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const c = require("../controllers/authController");

// Slow down password-guessing: max 30 login/register attempts per 15 minutes per IP.
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again later." } });

router.post("/register", limiter, c.register);
router.post("/login", limiter, c.login);
router.post("/refresh", c.refresh);
router.post("/logout", c.logout);

module.exports = router;
