const router = require("express").Router();
const { getMessages } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.get("/:projectId", protect, getMessages);

module.exports = router;
