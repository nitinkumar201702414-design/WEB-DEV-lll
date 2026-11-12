const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { startSession } = require("../services/authService");
const { requireFields, assertObjectId, escapeRegex, getPagination, paginationMeta } = require("../utils/validate");

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// GET /api/users   (admin)  ?search=&role=&page=&limit=
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 100);
  const filter = {};
  if (req.query.role) filter.role = String(req.query.role);
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: users, pagination: paginationMeta(page, limit, total) });
});

// POST /api/users   (admin creates a user or another admin)
exports.createUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password"]);
  const { name, email, password, role = "user" } = req.body;
  if (![name, email, password].every((v) => typeof v === "string")) throw new ApiError(400, "Invalid input");
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Invalid email address");
  if (!["admin", "user"].includes(role)) throw new ApiError(400, "Role must be admin or user");
  if (await User.findOne({ email: email.toLowerCase().trim() })) throw new ApiError(409, "Email already registered");

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, data: user });
});

// PATCH /api/users/:id/role   (admin promotes / demotes)
exports.updateUserRole = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "user id");
  const { role } = req.body;
  if (!["admin", "user"].includes(role)) throw new ApiError(400, "Role must be admin or user");
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, "You cannot change your own role");

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.role = role;
  await user.save();
  res.json({ success: true, data: user });
});

// GET /api/users/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// PATCH /api/users/me   (only name and profile picture can be changed)
exports.updateMe = asyncHandler(async (req, res) => {
  if (req.body.email !== undefined || req.body.role !== undefined) {
    throw new ApiError(403, "Email and role cannot be changed here");
  }
  const { name, profilePicture } = req.body;
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) throw new ApiError(400, "Name must be at least 2 characters");
    req.user.name = name;
  }
  if (profilePicture !== undefined) {
    if (typeof profilePicture !== "string" || (profilePicture && !/^https?:\/\/\S+$/.test(profilePicture))) {
      throw new ApiError(400, "Profile picture must be an http(s) URL");
    }
    req.user.profilePicture = profilePicture;
  }
  await req.user.save();
  res.json({ success: true, data: req.user });
});

// PATCH /api/users/me/password
exports.changePassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ["currentPassword", "newPassword", "confirmPassword"]);
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (![currentPassword, newPassword, confirmPassword].every((v) => typeof v === "string")) throw new ApiError(400, "Invalid input");
  if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");
  if (newPassword !== confirmPassword) throw new ApiError(400, "Passwords do not match");

  const user = await User.findById(req.user._id).select("+password +refreshTokens");
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;     // hashed by the pre-save hook
  user.refreshTokens = [];          // log out every other device
  const accessToken = await startSession(user, res);
  res.json({ success: true, message: "Password updated", data: { accessToken } });
});
