import User from "../models/userModel.js";
import argon2 from "argon2";

const createUser = async ({ username, email, password }) => {
  const hashPassword = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

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
