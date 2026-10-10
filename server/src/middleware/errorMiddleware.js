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
