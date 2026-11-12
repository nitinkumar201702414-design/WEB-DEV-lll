const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const config = require("../config/config");

// 1) Authentication: "who are you?"  -> 401 if we can't tell.
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) throw new ApiError(401, "Not authenticated. Please log in.");

  let decoded;
  try {
    decoded = jwt.verify(token, config.accessSecret);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }

  // Load the user from the database so role changes take effect immediately.
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User no longer exists");

  req.user = user;
  next();
});

// 2) Authorization: "are you allowed?"  -> 403 if not.   Usage: authorize("admin")
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  next();
};
