import { createAccessToken, createRefreshToken } from "../utils/token.js";
import Session from "../models/sessionModel.js";

export const issueToken = async (userId) => {
  const accessToken = createAccessToken(userId);

  const refreshToken = createRefreshToken(userId);

  await Session.create({
    jti: refreshToken.jti,
    userId: userId,
    expireAt: refreshToken.expireAt,
  });

  return {
    accessToken,
    refreshToken: refreshToken.token,
    refreshTokenExpireAt: refreshToken.expireAt,
  };
};
