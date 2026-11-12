const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const toCounts = (rows) => {
  const c = { pending: 0, inProgress: 0, completed: 0 };
  rows.forEach((r) => {
    if (r._id === "pending") c.pending = r.count;
    if (r._id === "in-progress") c.inProgress = r.count;
    if (r._id === "completed") c.completed = r.count;
  });
  c.total = c.pending + c.inProgress + c.completed;
  return c;
};

// GET /api/dashboard   (different data for admin and user)
exports.getDashboard = asyncHandler(async (req, res) => {
  const countByStatus = (match) => Task.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]);

  if (req.user.role === "admin") {
    const [users, projects, rows, recentProjects, recentTasks] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      countByStatus({}),
      Project.find().sort({ createdAt: -1 }).limit(5).select("name status endDate createdAt"),
      Task.find().sort({ createdAt: -1 }).limit(5).populate("project", "name").populate("assignedTo", "name"),
    ]);
    return res.json({ success: true, data: { role: "admin", stats: { users, projects, ...toCounts(rows) }, recentProjects, recentTasks } });
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [projects, rows, upcoming, notifications, unread] = await Promise.all([
    Project.countDocuments({ members: req.user._id }),
    countByStatus({ assignedTo: req.user._id }),
    Task.find({ assignedTo: req.user._id, status: { $ne: "completed" }, deadline: { $gte: today } })
      .sort({ deadline: 1 }).limit(5).populate("project", "name"),
    Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(5),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data: { role: "user", stats: { projects, ...toCounts(rows) }, upcoming, notifications, unread } });
});
