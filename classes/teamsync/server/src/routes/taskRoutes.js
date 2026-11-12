const router = require("express").Router();
const c = require("../controllers/taskController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.route("/").get(c.getTasks).post(authorize("admin"), c.createTask);
router.patch("/:id/status", c.updateTaskStatus); // admin OR the assigned user (checked in the controller)
router.route("/:id").get(c.getTask).patch(authorize("admin"), c.updateTask).delete(authorize("admin"), c.deleteTask);

module.exports = router;
