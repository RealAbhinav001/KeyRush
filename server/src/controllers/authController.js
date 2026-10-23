import createUser from "../services/createUser.js";
import { issueToken } from "../services/issueToken.js";
import loginUser from "../services/loginUser.js";
import { env } from "../config/env.js";
import { refreshToken, deleteToken } from "../services/refreshToken.js";

const Refresh_Token_Path = "/api/auth";

const cookieOptions = (tokens) => {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production" ? true : false,
    sameSite: "strict",
    expires: tokens.refreshTokenExpireAt,
    path: Refresh_Token_Path,
  };
};

export const signUpController = async (req, res) => {
  const data = req.validated.body;
  const user = await createUser(data);

  const tokens = await issueToken(user.id);

  res.cookie("refreshToken", tokens.refreshToken, cookieOptions(tokens));

  res.status(201).json({
    user: user,
    accessToken: tokens.accessToken,
  });
};

export const loginController = async (req, res) => {
  const data = req.validated.body;
  const user = await loginUser(data);

  const tokens = await issueToken(user.id);

  res.cookie("refreshToken", tokens.refreshToken, cookieOptions(tokens));

  res.status(200).json({
    user: user,
    accessToken: tokens.accessToken,
  });
};

export const refreshController = async (req, res) => {
  const token = req.cookies.refreshToken;

  res.clearCookie("refreshToken", { path: Refresh_Token_Path });

  const result = await refreshToken(token);

  res.cookie("refreshToken", result.refreshToken, cookieOptions(result));

  res.status(200).json({
    accessToken: result.accessToken,
  });
};

export const logoutController = async (req, res) => {
  const token = req.cookies.refreshToken;

  res.clearCookie("refreshToken", { path: Refresh_Token_Path });
  await deleteToken(token);

  res.sendStatus(204);
};
