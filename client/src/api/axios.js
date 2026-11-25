import axios from "axios";
import { errorInterceptor } from "./apiError";
import { getAccessToken } from "./token";

const instance = axios.create({
  baseURL: "/api",
  timeout: 15000
});

instance.interceptors.response.use(
  (response) => response,

  (error) => errorInterceptor(error),
);

instance.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default instance;
