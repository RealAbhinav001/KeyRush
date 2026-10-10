import ApiError from "../utils/apiError.js";

const errorMiddleware = (err, req, res, next) => {
  const error = (statusCode, code, message, details) => {
    res.status(statusCode).json({
      error: {
        code: code,
        message: message,
        details: details,
      },
    });
  };
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    error(err.statusCode, err.code, err.message, err.details);
  } else if (err.type === "entity.parse.failed") {
    error(400, "INVALID_JSON", "Request body is not valid JSON.");
  } else if (err.type === "entity.too.large") {
    error(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  } else {
    console.error(err);
    error(500, "INTERNAL_ERROR", "Something went wrong. Please try again later.");
  }
};

export default errorMiddleware;
