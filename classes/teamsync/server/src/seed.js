// Run with:  npm run seed     (WARNING: wipes the database first)
const mongoose = require("mongoose");
const config = require("./config/config");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const Message = require("./models/Message");
const Notification = require("./models/Notification");

const days = (n) => new Date(Date.now() + n * 86400000);

(async () => {
  await mongoose.connect(config.mongoUri);
  await Promise.all([User, Project, Task, Message, Notification].map((m) => m.deleteMany({})));

  const admin = await User.create({ name: "Admin User", email: "admin@teamsync.com", password: "Admin@123", role: "admin" });
  const [alice, bob, carol] = await User.create([
    { name: "Alice Johnson", email: "alice@teamsync.com", password: "User@1234" },
    { name: "Bob Smith", email: "bob@teamsync.com", password: "User@1234" },
    { name: "Carol Lee", email: "carol@teamsync.com", password: "User@1234" },
  ]);

  const web = await Project.create({
    name: "Website Redesign", description: "Refresh the marketing site", status: "active",
    startDate: days(-10), endDate: days(45), createdBy: admin._id, members: [admin._id, alice._id, bob._id],
  });
  const app = await Project.create({
    name: "Mobile App Launch", description: "Ship v1 of the mobile app", status: "planning",
    startDate: days(0), endDate: days(90), createdBy: admin._id, members: [admin._id, bob._id, carol._id],
  });

  await Task.create([
    { title: "Design homepage mockup", project: web._id, assignedTo: alice._id, priority: "high", status: "completed", deadline: days(3) },
    { title: "Build navigation component", project: web._id, assignedTo: bob._id, priority: "medium", status: "in-progress", deadline: days(7) },
    { title: "Write landing page copy", project: web._id, assignedTo: alice._id, priority: "low", status: "pending", deadline: days(12) },
    { title: "Set up CI pipeline", project: app._id, assignedTo: bob._id, priority: "high", status: "pending", deadline: days(5) },
    { title: "Create onboarding screens", project: app._id, assignedTo: carol._id, priority: "medium", status: "in-progress", deadline: days(14) },
    { title: "Plan beta test", project: app._id, assignedTo: carol._id, priority: "low", status: "pending", deadline: days(30) },
  ]);

  await Message.create([
    { sender: admin._id, project: web._id, message: "Welcome to the Website Redesign project!" },
    { sender: alice._id, project: web._id, message: "Thanks! Mockups coming soon." },
  ]);

  console.log("\nSeed complete. Log in with:");
  console.log("  Admin: admin@teamsync.com / Admin@123");
  console.log("  User : alice@teamsync.com / User@1234  (also bob@ and carol@)\n");
  await mongoose.disconnect();
})().catch((err) => { console.error(err); process.exit(1); });
