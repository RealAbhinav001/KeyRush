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

  const expireAt = new Date(jwt.decode(token).exp * 1000);

  return { token, jti, expireAt };
};
