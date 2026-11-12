const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const config = require("../config/config");
const events = require("../events/eventEmitter");
const { requireFields } = require("../utils/validate");
const { startSession } = require("../services/authService");
const { signRefreshToken, hashToken, setRefreshCookie, clearRefreshCookie } = require("../utils/tokens");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const allStrings = (...values) => values.every((v) => typeof v === "string");

// POST /api/auth/register   (public - always creates a normal "user")
exports.register = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password", "confirmPassword"]);
  const { name, email, password, confirmPassword } = req.body;
  if (!allStrings(name, email, password, confirmPassword)) throw new ApiError(400, "Invalid input");
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Invalid email address");
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");
  if (password !== confirmPassword) throw new ApiError(400, "Passwords do not match");

  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    throw new ApiError(409, "Email already registered");
  }

  // NOTE: role is hard-coded. Anything the client sends as "role" is ignored.
  const user = await User.create({ name, email, password, role: "user" });
  const accessToken = await startSession(user, res);
  events.emit("userRegistered", { user });

  res.status(201).json({ success: true, data: { user, accessToken } });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { email, password } = req.body;
  if (!allStrings(email, password)) throw new ApiError(400, "Invalid input");

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password +refreshTokens");
  // Same message for "no such user" and "wrong password" so attackers can't tell which emails exist.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = await startSession(user, res);
  res.json({ success: true, data: { user, accessToken } });
});

// POST /api/auth/refresh   (uses the HttpOnly cookie; implements refresh-token ROTATION)
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token");

  let decoded;
  try {
    decoded = jwt.verify(token, config.refreshSecret);
  } catch (err) {
    clearRefreshCookie(res);
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user) {
    clearRefreshCookie(res);
    throw new ApiError(401, "User no longer exists");
  }

  const oldHash = hashToken(token);
  const index = user.refreshTokens.indexOf(oldHash);

  // A validly signed token that is NOT in our list was already used => it may have been stolen.
  // Revoke every session of this user.
  if (index === -1) {
    user.refreshTokens = [];
    await user.save();
    clearRefreshCookie(res);
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  // Rotation: replace the old token with a brand new one.
  const newRefreshToken = signRefreshToken(user);
  const tokens = [...user.refreshTokens];
  tokens[index] = hashToken(newRefreshToken);
  user.refreshTokens = tokens;
  await user.save();
  setRefreshCookie(res, newRefreshToken);

  const { signAccessToken } = require("../utils/tokens");
  res.json({ success: true, data: { user, accessToken: signAccessToken(user) } });
});

// POST /api/auth/logout   (revokes the current refresh token)
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.refreshSecret);
      await User.updateOne({ _id: decoded.id }, { $pull: { refreshTokens: hashToken(token) } });
    } catch (err) {
      /* token already invalid - nothing to revoke */
    }
  }
  clearRefreshCookie(res);
  res.json({ success: true, message: "Logged out" });
});
