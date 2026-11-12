// Holds the Socket.IO server instance so other files (like the notification service) can use it.
let io = null;
exports.setIO = (instance) => { io = instance; };
exports.getIO = () => io;
