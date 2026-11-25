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

let refreshPromise = null;

export const refreshToken = () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = api
    .post("/auth/refresh")
    .then((response) => {
      setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const getMe = async () => {
  const response = await api.get("/users/me");

  return response.data.user;
};
