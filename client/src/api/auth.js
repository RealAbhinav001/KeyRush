import api from "./axios.js";
import { setAccessToken } from "./token.js";

export const signUp = async (credentials) => {
  const response = await api.post("/auth/signup", credentials);

  setAccessToken(response.data.accessToken);
  return response.data.user;
};
