import createUser from "../services/createUser.js";

export const signUpController = async (req, res) => {
  const data = req.validated.body;
  const user = await createUser(data);
  res.status(201).json(user);
};
