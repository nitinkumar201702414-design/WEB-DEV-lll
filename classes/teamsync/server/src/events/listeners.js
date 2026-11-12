const events = require("./eventEmitter");
const User = require("../models/User");
const { notifyUsers } = require("../services/notificationService");

// If a listener crashes it should never crash the server.
const safe = (fn) => async (payload) => {
  try {
    await fn(payload);
  } catch (err) {
    console.error("Event handler error:", err.message);
  }
};

const getAdminIds = async (excludeId) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  return admins.map((a) => a._id).filter((id) => String(id) !== String(excludeId));
};

module.exports = function registerEventListeners() {
  events.on("userRegistered", safe(async ({ user }) => {
    const admins = await getAdminIds(user._id);
    await notifyUsers(admins, { type: "userRegistered", message: `New user registered: ${user.name} (${user.email})` });
  }));

  events.on("projectCreated", safe(async ({ project, createdBy }) => {
    const others = project.members.filter((m) => String(m) !== String(createdBy));
    await notifyUsers(others, {
      type: "projectCreated",
      message: `You were added to the new project "${project.name}"`,
      relatedProject: project._id,
    });
  }));

  events.on("memberAddedToProject", safe(async ({ project, userId }) => {
    await notifyUsers([userId], {
      type: "memberAddedToProject",
      message: `You were added to the project "${project.name}"`,
      relatedProject: project._id,
    });
  }));

  events.on("taskAssigned", safe(async ({ task, projectName }) => {
    await notifyUsers([task.assignedTo], {
      type: "taskAssigned",
      message: `New task assigned to you: "${task.title}" (${projectName})`,
      relatedProject: task.project,
      relatedTask: task._id,
    });
  }));

  events.on("taskCompleted", safe(async ({ task, completedBy, completedByName }) => {
    const admins = await getAdminIds(completedBy);
    await notifyUsers(admins, {
      type: "taskCompleted",
      message: `${completedByName} completed the task "${task.title}"`,
      relatedProject: task.project,
      relatedTask: task._id,
    });
  }));
};
