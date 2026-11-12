const Message = require("../models/Message");
const Project = require("../models/Project");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { assertObjectId, getPagination, paginationMeta } = require("../utils/validate");

// GET /api/messages/:projectId?page=&limit=   (chat history, members only)
exports.getMessages = asyncHandler(async (req, res) => {
  assertObjectId(req.params.projectId, "project id");
  if (!(await Project.exists({ _id: req.params.projectId, members: req.user._id }))) {
    throw new ApiError(403, "You are not a member of this project");
  }
  const { page, limit, skip } = getPagination(req.query, 100, 50);
  const filter = { project: req.params.projectId };

  const [rows, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("sender", "name"),
    Message.countDocuments(filter),
  ]);
  // We fetched newest-first for paging; reverse so the chat reads oldest -> newest.
  res.json({ success: true, data: rows.reverse(), pagination: paginationMeta(page, limit, total) });
});
