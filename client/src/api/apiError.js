import axios from "axios";

export const errorInterceptor = (axiosError) => {
  const normalizedError = {
    success: false,
    status: null,
    code: "UNKNOWN_ERROR",
    message: "Unexpected Error Occur",
    details: {},
  };

  if (axios.isCancel(axiosError)) {
    return Promise.reject(axiosError);

  
  } 
  else if((axiosError?.response?.status === 502 ||axiosError?.response?.status === 503 || axiosError?.response?.status === 504) && !axiosError.response.data?.error ){
    normalizedError.status = axiosError.response.status
    normalizedError.code = "SERVER_UNREACHABLE"
    normalizedError.message = "Can't Reach the Server. Try Again"
  }
  else if (axiosError.response) {
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
      normalizedError.message = "Can't Reach the Server. Try Again";
    }
  }



  return Promise.reject(normalizedError);
};
