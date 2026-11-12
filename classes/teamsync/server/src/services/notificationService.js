const Notification = require("../models/Notification");
const { getIO } = require("../socket/io");

// Saves a notification for each recipient, then pushes it live through Socket.IO.
exports.notifyUsers = async (recipientIds, data) => {
  const unique = [...new Set(recipientIds.map(String))];
  const io = getIO();
  await Promise.all(
    unique.map(async (id) => {
      const notification = await Notification.create({ ...data, recipient: id });
      // Every user joins a private room called "user:<id>" when their socket connects.
      if (io) io.to(`user:${id}`).emit("notification:new", notification);
    })
  );
};
