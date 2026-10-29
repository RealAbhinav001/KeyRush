import User from "../models/userModel.js";
import { unauthenticatedError } from "../utils/errors.js";

export const findAuthUser = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw unauthenticatedError();
  }

  return user;
};
