const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");
const Project = require("../models/Project");
const Message = require("../models/Message");
const { setIO } = require("./io");
const { isObjectId } = require("../utils/validate");

const onlineCount = new Map(); // userId -> number of open connections (tabs/devices)

const isProjectMember = async (projectId, userId) =>
  isObjectId(projectId) && !!(await Project.exists({ _id: projectId, members: userId }));

exports.initSocket = (httpServer) => {
  const io = new Server(httpServer, { cors: { origin: config.clientUrl, credentials: true } });
  setIO(io);

  // Runs once per connection: reject anyone without a valid JWT.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));
      const decoded = jwt.verify(token, config.accessSecret);
      const user = await User.findById(decoded.id).select("name role");
      if (!user) return next(new Error("Authentication failed"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);

    // Private room for notifications addressed to this user.
    socket.join(`user:${userId}`);

    // Online / offline tracking
    onlineCount.set(userId, (onlineCount.get(userId) || 0) + 1);
    io.emit("presence:update", { userId, online: true });
    socket.on("presence:get", (cb) => typeof cb === "function" && cb([...onlineCount.keys()]));

    // Join a project's chat room (only if the user is a member)
    socket.on("project:join", async (projectId, cb) => {
      const reply = typeof cb === "function" ? cb : () => {};
      if (!(await isProjectMember(projectId, userId))) {
        return reply({ ok: false, message: "You are not a member of this project" });
      }
      socket.join(`project:${projectId}`);
      reply({ ok: true });
    });

    socket.on("project:leave", (projectId) => socket.leave(`project:${projectId}`));

    // Send a chat message: validate, save to MongoDB, broadcast to the room.
    socket.on("message:send", async ({ projectId, message } = {}, cb) => {
      const reply = typeof cb === "function" ? cb : () => {};
      try {
        if (typeof message !== "string" || !message.trim() || message.length > 2000) {
          return reply({ ok: false, message: "Message must be 1-2000 characters" });
        }
        // Re-check membership on EVERY message (the user may have been removed from the project).
        if (!(await isProjectMember(projectId, userId))) {
          return reply({ ok: false, message: "You are not a member of this project" });
        }
        const saved = await Message.create({ sender: userId, project: projectId, message: message.trim() });
        await saved.populate("sender", "name");
        io.to(`project:${projectId}`).emit("message:new", saved.toJSON());
        reply({ ok: true });
      } catch (err) {
        reply({ ok: false, message: "Could not send message" });
      }
    });

    // Typing indicator (only relayed to people already in that room)
    socket.on("typing", ({ projectId, isTyping } = {}) => {
      if (!socket.rooms.has(`project:${projectId}`)) return;
      socket.to(`project:${projectId}`).emit("typing", {
        projectId, userId, name: socket.user.name, isTyping: !!isTyping,
      });
    });

    socket.on("disconnect", () => {
      const left = (onlineCount.get(userId) || 1) - 1;
      if (left <= 0) {
        onlineCount.delete(userId);
        io.emit("presence:update", { userId, online: false });
      } else {
        onlineCount.set(userId, left);
      }
    });
  });

  return io;
};
