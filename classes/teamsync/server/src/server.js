const http = require("http");
const config = require("./config/config"); // loads .env first
const connectDB = require("./config/db");
const app = require("./app");
const { initSocket } = require("./socket/socketServer");
const registerEventListeners = require("./events/listeners");

const server = http.createServer(app); // Express and Socket.IO share one HTTP server
initSocket(server);
registerEventListeners();

connectDB().then(() => {
  server.listen(config.port, () => console.log(`TeamSync API running on http://localhost:${config.port}`));
});
