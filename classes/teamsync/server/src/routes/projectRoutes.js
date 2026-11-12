const router = require("express").Router();
const c = require("../controllers/projectController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.route("/").get(c.getProjects).post(authorize("admin"), c.createProject);
router.route("/:id").get(c.getProject).patch(authorize("admin"), c.updateProject).delete(authorize("admin"), c.deleteProject);
router.post("/:id/members", authorize("admin"), c.addMember);
router.delete("/:id/members/:userId", authorize("admin"), c.removeMember);

module.exports = router;
