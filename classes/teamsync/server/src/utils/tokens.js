const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/config");

// Short-lived token sent in the Authorization header.
exports.signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, config.accessSecret, { expiresIn: config.accessExpires });

// Long-lived token kept in an HttpOnly cookie. "jti" makes every token unique.
exports.signRefreshToken = (user) =>
  jwt.sign({ id: user._id, jti: crypto.randomUUID() }, config.refreshSecret, { expiresIn: config.refreshExpires });

// We store only a hash of each refresh token, so a database leak can't be used to log in.
exports.hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const cookieOptions = () => ({
  httpOnly: true,                              // JavaScript in the browser cannot read it
  secure: config.isProd,                       // HTTPS only in production
  sameSite: config.isProd ? "none" : "lax",    // "none" is needed if frontend and API are on different domains
  path: "/api/auth",                           // only sent to auth routes
});

exports.setRefreshCookie = (res, token) =>
  res.cookie("refreshToken", token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

exports.clearRefreshCookie = (res) => res.clearCookie("refreshToken", cookieOptions());
