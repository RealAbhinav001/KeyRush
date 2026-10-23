import createUser from "../services/createUser.js";
import { issueToken } from "../services/issueToken.js";
import loginUser from "../services/loginUser.js";
import { env } from "../config/env.js";

const cookieOptions = (tokens) => {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production" ? true : false,
    sameSite: "strict",
    expires: tokens.refreshTokenExpireAt,
    path: "/api/auth",
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
