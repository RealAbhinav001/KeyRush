import ApiError from "../utils/apiError.js";
import logger from "../config/logger.js";
import { getRequestId } from "../utils/requestContext.js";

const STATUS_BY_CODE = {
  "EMAIL_TAKEN":409,
  "USERNAME_TAKEN":409
}

const errorMiddleware = (err, req, res, next) => {

  const error = (statusCode, code, message, details) => {
    res.status(statusCode).json({
      error: {
        code: code,
        message: message,
        details: details,
        requestId: getRequestId(),
      },
    });
  };
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    error(err.statusCode, err.code, err.message, err.details);
  } else if(STATUS_BY_CODE[err.code]){
    error(STATUS_BY_CODE[err.code],err.code,err.message)
  }
  else if (err.type === "entity.parse.failed") {
    error(400, "INVALID_JSON", "Request body is not valid JSON.");
  } else if (err.type === "entity.too.large") {
    error(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  } else {
    logger.error(err);
    error(500, "INTERNAL_ERROR", "Something went wrong. Please try again later.");
  }
};

export default errorMiddleware;
