import createUser from "../services/createUser.js";
import { issueToken } from "../services/issueToken.js";

export const signUpController = async (req, res) => {
  const data = req.validated.body;
  const user = await createUser(data);

  const tokens = await issueToken(user.id);

  res.status(201).json({
    user: user,
    accessToken: tokens.accessToken,
  });
};
