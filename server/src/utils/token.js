import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAccessToken = (userId) => {
  const token = jwt.sign(
    {
      userId: userId,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "10m",
    },
  );

  return token;
};

export const createRefreshToken = (userId) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    {
      userId: userId,
      jti: jti,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );

  const expireAt = jwt.decode(token).exp;

  return { token, jti, expireAt };
};
