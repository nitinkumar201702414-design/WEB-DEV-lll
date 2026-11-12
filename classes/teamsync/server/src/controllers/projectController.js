const Project = require("../models/Project");
const Task = require("../models/Task");
const Message = require("../models/Message");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const events = require("../events/eventEmitter");
const { POPULATE, isMember, attachProgress, validateMembers } = require("../services/projectService");
const {
  requireFields, assertObjectId, parseDate, escapeRegex, getPagination, paginationMeta,
} = require("../utils/validate");

const loadFull = async (id) => {
  const project = await Project.findById(id).populate(POPULATE);
  return project ? (await attachProgress([project]))[0] : null;
};

// POST /api/projects   (admin)
exports.createProject = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "startDate", "endDate"]);
  const { name, description, status } = req.body;
  const startDate = parseDate(req.body.startDate, "start date");
  const endDate = parseDate(req.body.endDate, "end date");
  if (endDate < startDate) throw new ApiError(400, "End date must be on or after the start date");

  const memberIds = await validateMembers(req.body.members || []);
  const members = [...new Set([String(req.user._id), ...memberIds])]; // creator is always a member

  const project = await Project.create({ name, description, status, startDate, endDate, members, createdBy: req.user._id });
  events.emit("projectCreated", { project, createdBy: req.user._id });

  res.status(201).json({ success: true, data: await loadFull(project._id) });
});

// GET /api/projects   admin: all projects.  user: only projects they belong to.
exports.getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.user.role === "admin" ? {} : { members: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search), "i");

  const [projects, total] = await Promise.all([
    Project.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  res.json({ success: true, data: await attachProgress(projects), pagination: paginationMeta(page, limit, total) });
});

// GET /api/projects/:id   (admin or member)
exports.getProject = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "project id");
  const project = await loadFull(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (req.user.role !== "admin" && !isMember(project, req.user._id)) {
    throw new ApiError(403, "You are not a member of this project");
  }
  res.json({ success: true, data: project });
});

// PATCH /api/projects/:id   (admin)
exports.updateProject = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "project id");
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  // Only these fields may be edited (members have their own endpoints).
  ["name", "description", "status"].forEach((f) => {
    if (req.body[f] !== undefined) project[f] = req.body[f];
  });
  if (req.body.startDate !== undefined) project.startDate = parseDate(req.body.startDate, "start date");
  if (req.body.endDate !== undefined) project.endDate = parseDate(req.body.endDate, "end date");
  if (project.endDate < project.startDate) throw new ApiError(400, "End date must be on or after the start date");

  await project.save();
  res.json({ success: true, data: await loadFull(project._id) });
});

// DELETE /api/projects/:id   (admin) - also deletes the project's tasks and chat messages
exports.deleteProject = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "project id");
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");

  await Promise.all([
    Task.deleteMany({ project: project._id }),
    Message.deleteMany({ project: project._id }),
  ]);
  await project.deleteOne();
  res.json({ success: true, message: "Project, its tasks and its messages were deleted" });
});

// POST /api/projects/:id/members   body: { userId }   (admin)
exports.addMember = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "project id");
  requireFields(req.body, ["userId"]);
  assertObjectId(req.body.userId, "user id");

  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!(await User.exists({ _id: req.body.userId }))) throw new ApiError(404, "User not found");
  if (isMember(project, req.body.userId)) throw new ApiError(409, "User is already a member");

  project.members.push(req.body.userId);
  await project.save();
  events.emit("memberAddedToProject", { project, userId: req.body.userId });
  res.json({ success: true, data: await loadFull(project._id) });
});

// DELETE /api/projects/:id/members/:userId   (admin)
exports.removeMember = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "project id");
  assertObjectId(req.params.userId, "user id");

  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isMember(project, req.params.userId)) throw new ApiError(404, "User is not a member");
  if (String(project.createdBy) === req.params.userId) throw new ApiError(400, "The project creator cannot be removed");

  // Business rule: a member who still owns tasks can't be removed (reassign or delete those tasks first).
  const openTasks = await Task.countDocuments({ project: project._id, assignedTo: req.params.userId });
  if (openTasks > 0) throw new ApiError(409, `This member still has ${openTasks} task(s) in the project. Reassign or delete them first.`);

  project.members = project.members.filter((m) => String(m) !== req.params.userId);
  await project.save();
  res.json({ success: true, data: await loadFull(project._id) });
});
