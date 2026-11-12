const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { isObjectId } = require("../utils/validate");

// Fields to populate whenever we return a project.
exports.POPULATE = [
  { path: "members", select: "name email role" },
  { path: "createdBy", select: "name" },
];

exports.isMember = (project, userId) =>
  project.members.some((m) => String(m._id || m) === String(userId));

// Adds { taskCounts, progress } to each project (progress = % of tasks completed).
exports.attachProgress = async (projects) => {
  const ids = projects.map((p) => p._id);
  const rows = await Task.aggregate([
    { $match: { project: { $in: ids } } },
    { $group: { _id: { project: "$project", status: "$status" }, count: { $sum: 1 } } },
  ]);
  return projects.map((p) => {
    const obj = p.toObject();
    const counts = { pending: 0, "in-progress": 0, completed: 0 };
    rows.filter((r) => String(r._id.project) === String(p._id)).forEach((r) => (counts[r._id.status] = r.count));
    const total = counts.pending + counts["in-progress"] + counts.completed;
    obj.taskCounts = counts;
    obj.progress = total ? Math.round((counts.completed / total) * 100) : 0;
    return obj;
  });
};

// Makes sure every id is a real, registered user. Returns unique id strings.
exports.validateMembers = async (ids) => {
  if (!Array.isArray(ids)) throw new ApiError(400, "members must be an array of user ids");
  const unique = [...new Set(ids.map(String))];
  if (unique.some((id) => !isObjectId(id))) throw new ApiError(400, "Invalid member id");
  const count = await User.countDocuments({ _id: { $in: unique } });
  if (count !== unique.length) throw new ApiError(400, "Only registered users can be project members");
  return unique;
};

exports.toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(id));
