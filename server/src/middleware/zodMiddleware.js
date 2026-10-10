import ApiError from "../utils/apiError.js";

const keys = ["body", "params", "query"];

export const validateRequest = (schema) => (req, res, next) => {
  const errorArray = [];
  const validated = {};

  const addError = (result) => {
    errorArray.push(
      ...result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  };

  for (const key of keys) {
    if (schema[key]) {
      const result = schema[key].safeParse(req[key]);
      if (result.success === false) {
        addError(result);
      } else {
        validated[key] = result.data;
      }
    }
  }

  if (errorArray.length > 0) {
    throw new ApiError(400, "Request validation failed.", "VALIDATION_ERROR", errorArray);
  } else {
    req.validated = validated;
    next();
  }
};
