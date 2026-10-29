import { verifyAccessToken } from "../utils/token.js";
import { findAuthUser } from "../services/findAuthUser.js";
import { unauthenticatedError } from "../utils/errors.js";

export const requireAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw unauthenticatedError();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw unauthenticatedError();
  }

  const token = parts[1];
  const payload = verifyAccessToken(token);

  const user = await findAuthUser(payload.userId);

  req.user = user;

  next();
};
