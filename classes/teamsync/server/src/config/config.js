// Loads .env and exposes settings in one place.
require("dotenv").config();

// Fail fast if an important secret is missing.
["MONGO_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key} (check your .env file)`);
    process.exit(1);
  }
});

module.exports = {
  port: process.env.PORT || 5000,
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",
};
