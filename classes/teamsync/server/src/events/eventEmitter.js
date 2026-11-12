// One shared EventEmitter for the whole app.
// Controllers call:   events.emit("taskAssigned", {...})
// Listeners (below) react without the controller knowing anything about notifications.
const EventEmitter = require("events");
module.exports = new EventEmitter();
