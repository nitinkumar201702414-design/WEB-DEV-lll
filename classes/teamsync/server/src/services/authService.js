const { signAccessToken, signRefreshToken, hashToken, setRefreshCookie } = require("../utils/tokens");

// Creates a login session: stores the hashed refresh token, sets the cookie, returns an access token.
exports.startSession = async (user, res) => {
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = [...(user.refreshTokens || []), hashToken(refreshToken)].slice(-5);
  await user.save();
  setRefreshCookie(res, refreshToken);
  return signAccessToken(user);
};
