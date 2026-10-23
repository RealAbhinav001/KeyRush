import argon2 from "argon2";

const setting = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export const dummyHash = await argon2.hash(crypto.randomUUID(), setting);

export const createHashPassword = async (password) => {
  const hashpassword = await argon2.hash(password, setting);
  return hashpassword;
};

export const verifyUserPassword = async (hashPassword, plainPassword) => {
  const isPassword = await argon2.verify(hashPassword, plainPassword);

  return isPassword;
};
