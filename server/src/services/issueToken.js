import { createAccessToken, createRefreshToken } from "../utils/token.js";
import Session from "../models/sessionModel.js";

export const issueToken = async (userId) => {
  const accessToken = createAccessToken(userId);

  const refreshToken = createRefreshToken(userId);

  await Session.create({
    jti: refreshToken.jti,
    userId: userId,
    expireAt: new Date(refreshToken.expireAt * 1000),
  });

  return { accessToken, refreshToken: refreshToken.token, refreshTokenJti: refreshToken.jti };
};
