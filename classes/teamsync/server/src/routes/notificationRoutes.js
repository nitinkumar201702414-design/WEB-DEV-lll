const router = require("express").Router();
const c = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", c.getNotifications);
router.get("/unread-count", c.getUnreadCount);
router.patch("/read-all", c.markAllRead);
router.patch("/:id/read", c.markRead);

module.exports = router;
