import api from "./axios.js";
import { setAccessToken } from "./token.js";

const authRequest = async (path, credentials) => {
  const response = await api.post(path, credentials);

  setAccessToken(response.data.accessToken);
  return response.data.user;
};

export const signUp = async (credentials) => {
  const user = await authRequest("/auth/signup", credentials);
  return user;
};

export const logIn = async (credentials) => {
  const user = await authRequest("/auth/login", credentials);
  return user;
};
