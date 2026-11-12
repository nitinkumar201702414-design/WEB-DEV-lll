const router = require("express").Router();
const c = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect); // every route below needs a valid access token

// Own profile (any logged-in user). These must come BEFORE "/:id" style routes.
router.get("/me", c.getMe);
router.patch("/me", c.updateMe);
router.patch("/me/password", c.changePassword);

// Admin only
router.route("/").get(authorize("admin"), c.getUsers).post(authorize("admin"), c.createUser);
router.patch("/:id/role", authorize("admin"), c.updateUserRole);

module.exports = router;
