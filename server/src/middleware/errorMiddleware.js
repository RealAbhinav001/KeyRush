import ApiError from "../utils/apiError.js";

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    const statusCode = err.statusCode;
    const code = err.code;

    res.status(statusCode).json({
      error: {
        code: code,
        message: err.message,
        details: err.details,
      },
    });
  } else if (err.type === "entity.parse.failed") {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body is not valid JSON.",
      },
    });
  } else if (err.type === "entity.too.large") {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
      },
    });
  } else {
    console.error(err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again later.",
      },
    });
  }
};

export default errorMiddleware;
