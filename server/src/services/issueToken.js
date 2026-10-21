import { createAccessToken, createRefreshToken } from "../utils/token.js";

export const issueToken = (userId) => {
  const accessToken = createAccessToken(userId);

  const refreshToken = createRefreshToken(userId);

  return { accessToken, refreshToken: refreshToken.token, refreshTokenJti: refreshToken.jti };
};
