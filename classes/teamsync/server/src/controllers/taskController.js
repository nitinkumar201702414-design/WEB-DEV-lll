const Task = require("../models/Task");
const Project = require("../models/Project");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const events = require("../events/eventEmitter");
const { isMember } = require("../services/projectService");
const {
  requireFields, assertObjectId, parseDate, escapeRegex, getPagination, paginationMeta,
} = require("../utils/validate");

const STATUSES = ["pending", "in-progress", "completed"];
const POPULATE = [
  { path: "project", select: "name" },
  { path: "assignedTo", select: "name email" },
];

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

// POST /api/tasks   (admin)
exports.createTask = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "project", "assignedTo", "deadline"]);
  assertObjectId(req.body.project, "project id");
  assertObjectId(req.body.assignedTo, "user id");
  const deadline = parseDate(req.body.deadline, "deadline");
  if (deadline < startOfToday()) throw new ApiError(400, "Deadline cannot be in the past");

  const project = await Project.findById(req.body.project);
  if (!project) throw new ApiError(404, "Project not found");
  // Business rule: tasks can only be assigned to project members.
  if (!isMember(project, req.body.assignedTo)) throw new ApiError(400, "Assigned user is not a member of this project");

  const { title, description, priority, status } = req.body;
  const task = await Task.create({ title, description, priority, status, deadline, project: project._id, assignedTo: req.body.assignedTo });

  events.emit("taskAssigned", { task, projectName: project.name });
  res.status(201).json({ success: true, data: await task.populate(POPULATE) });
});

// GET /api/tasks  ?status=&priority=&search=&project=&assignedTo=&sort=deadline|-deadline&page=&limit=
// admin sees every task, a normal user sees only the tasks assigned to them.
exports.getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 100);
  const filter = {};
  const isAdmin = req.user.role === "admin";

  if (!isAdmin) filter.assignedTo = req.user._id;
  else if (req.query.assignedTo) { assertObjectId(req.query.assignedTo, "user id"); filter.assignedTo = req.query.assignedTo; }

  if (req.query.project) {
    assertObjectId(req.query.project, "project id");
    if (!isAdmin && !(await Project.exists({ _id: req.query.project, members: req.user._id }))) {
      throw new ApiError(403, "You are not a member of this project");
    }
    filter.project = req.query.project;
  }
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.priority) filter.priority = String(req.query.priority);
  if (req.query.search) filter.title = new RegExp(escapeRegex(req.query.search), "i");

  const sorts = { deadline: { deadline: 1 }, "-deadline": { deadline: -1 } };
  const sort = sorts[req.query.sort] || { createdAt: -1 };

  const [tasks, total] = await Promise.all([
    Task.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);
  res.json({ success: true, data: tasks, pagination: paginationMeta(page, limit, total) });
});

// GET /api/tasks/:id
exports.getTask = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "task id");
  const task = await Task.findById(req.params.id).populate(POPULATE);
  if (!task) throw new ApiError(404, "Task not found");
  if (req.user.role !== "admin" && String(task.assignedTo._id) !== String(req.user._id)) {
    throw new ApiError(403, "This task is not assigned to you");
  }
  res.json({ success: true, data: task });
});

// PATCH /api/tasks/:id   (admin - edit details, reassign)
exports.updateTask = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "task id");
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const { title, description, priority, status, deadline, assignedTo } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (deadline !== undefined) task.deadline = parseDate(deadline, "deadline");

  let reassigned = false;
  if (assignedTo !== undefined && String(assignedTo) !== String(task.assignedTo)) {
    assertObjectId(assignedTo, "user id");
    const project = await Project.findById(task.project);
    if (!project || !isMember(project, assignedTo)) throw new ApiError(400, "Assigned user is not a member of this project");
    task.assignedTo = assignedTo;
    reassigned = true;
  }

  const wasCompleted = task.status === "completed";
  if (status !== undefined) task.status = status;
  await task.save(); // runs schema validation (enums etc.)

  await task.populate(POPULATE);
  if (reassigned) events.emit("taskAssigned", { task, projectName: task.project.name });
  if (task.status === "completed" && !wasCompleted) {
    events.emit("taskCompleted", { task, completedBy: req.user._id, completedByName: req.user.name });
  }
  res.json({ success: true, data: task });
});

// PATCH /api/tasks/:id/status   (admin, or the user the task is assigned to) - ONLY the status
exports.updateTaskStatus = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "task id");
  const isAdmin = req.user.role === "admin";
  if (!isAdmin && Object.keys(req.body).some((k) => k !== "status")) {
    throw new ApiError(403, "You can only update the status of a task");
  }
  if (!STATUSES.includes(req.body.status)) throw new ApiError(400, `Status must be one of: ${STATUSES.join(", ")}`);

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");
  if (!isAdmin && String(task.assignedTo) !== String(req.user._id)) {
    throw new ApiError(403, "You can only update tasks assigned to you");
  }

  const wasCompleted = task.status === "completed";
  task.status = req.body.status;
  await task.save();
  if (task.status === "completed" && !wasCompleted) {
    events.emit("taskCompleted", { task, completedBy: req.user._id, completedByName: req.user.name });
  }
  res.json({ success: true, data: await task.populate(POPULATE) });
});

// DELETE /api/tasks/:id   (admin)
exports.deleteTask = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "task id");
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");
  res.json({ success: true, message: "Task deleted" });
});
