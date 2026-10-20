import User from "../models/userModel.js";
import { dummyHash, verifyUserPassword } from "../utils/password.js";

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email });
  const hash = user ? user.passwordHash : dummyHash;

  const isPassword = await verifyUserPassword(hash, password);

  if (!user || !isPassword) {
    const err = new Error("Invalid email or password");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  return user
};

export default loginUser;
