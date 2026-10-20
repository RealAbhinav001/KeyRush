import User from "../models/userModel.js";
import { createHashPassword } from "../utils/password.js";

const createUser = async ({ username, email, password }) => {
  const hashPassword = await createHashPassword(password);

  try {
    const user = await User.create({
      username: username,
      email: email,
      passwordHash: hashPassword,
    });

    return user;
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const duplicate = new Error(`${field} is already taken`);
      duplicate.code = field === "email" ? "EMAIL_TAKEN" : "USERNAME_TAKEN";
      throw duplicate;
    }

    throw error;
  }
};

export default createUser;
