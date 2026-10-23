import Session from "../models/sessionModel.js";
import { verifyRefreshToken } from "../utils/token.js";
import { issueToken } from "./issueToken.js";

export const refreshToken = async (token) => {
  if (!token) {
    const err = new Error("Your session has expired. Please log in again.");
    err.code = "UNAUTHENTICATED";
    throw err;
  }

  const data = verifyRefreshToken(token);

  const deletedSession = await Session.findOneAndDelete({ jti: data.jti });
  if (deletedSession === null) {
    const err = new Error("Your session has expired. Please log in again.");
    err.code = "UNAUTHENTICATED";
    throw err;
  }

  const newTokens = await issueToken(data.userId);

  return newTokens;
};

export const deleteToken = async (token) => {
  if (!token) {
    return;
  }

  try {
    const data = verifyRefreshToken(token);
    await Session.deleteOne({ jti: data.jti });
  } catch (err) {
    if (err.code === "UNAUTHENTICATED") {
      return;
    } else {
      throw err;
    }
  }
};
