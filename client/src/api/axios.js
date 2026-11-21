import axios from "axios";
import { errorInterceptor } from "./apiError";

const instance = axios.create({
  baseURL: "/api",
});

instance.interceptors.response.use(
  (response) => response,

  (error) => errorInterceptor(error),
);

export default instance;
