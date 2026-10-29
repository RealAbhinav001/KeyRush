import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthenticatedError } from "./errors.js";

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

export const verifyAccessToken = (accessToken) => {
  const data = jwt.verify(accessToken, env.JWT_ACCESS_SECRET, (err, decode) => {
    if (err) {
      throw unauthenticatedError();
    } else {
      return decode;
    }
  });

  return data;
};

export const verifyRefreshToken = (refreshToken) => {
  const data = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, (err, decode) => {
    if (err) {
      const err = new Error("Your session has expired. Please log in again.");
      err.code = "UNAUTHENTICATED";

      throw err;
    } else {
      return decode;
    }
  });

  return data;
};
