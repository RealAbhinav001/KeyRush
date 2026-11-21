import axios from "axios";

export const errorInterceptor = (axiosError) => {
  const normalizedError = {
    success: false,
    status: null,
    code: "UNKNOWN_ERROR",
    message: "unexpected error occur",
    details: {},
  };

  if (axios.isCancel(axiosError)) {
    return Promise.reject(axiosError);
  } else if (axiosError.response) {
    const { status, data } = axiosError.response;
    normalizedError.status = status;
    normalizedError.code = data?.error?.code || `HTTP_${status}`;
    normalizedError.message = data?.error?.message || "Unexpected Error Occur";
    normalizedError.details = Array.isArray(data?.error?.details)
      ? Object.fromEntries(data.error.details.map((item) => [item.field, item.message]))
      : {};

    if (normalizedError.code === "EMAIL_TAKEN") {
      normalizedError.details = { email: "That email is already registered" };
    } else if (normalizedError.code === "USERNAME_TAKEN") {
      normalizedError.details = { username: "That username is already registered" };
    }
  } else if (axiosError.request) {
    if (axiosError.code === "ECONNABORTED") {
      normalizedError.status = 0;
      normalizedError.code = "TIMEOUT";
      normalizedError.message = "The server took too long. Try again.";
    } else {
      normalizedError.status = 0;
      normalizedError.code = "NETWORK_ERROR";
      normalizedError.message = "Can't reach the server. Try again.";
    }
  }

  return Promise.reject(normalizedError);
};
