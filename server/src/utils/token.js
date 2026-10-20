import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const accessToken = (userId) => {
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

export const refreshToken = (userId) => {
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

  return { token, jti };
};
