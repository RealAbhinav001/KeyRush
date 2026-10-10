import ApiError from "../utils/apiError.js";

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

  if (schema.body) {
    const result = schema.body.safeParse(req.body);

    if (result.success === false) {
      addError(result);
    } else {
      validated.body = result.data;
    }
  }

  if (schema.params) {
    const result = schema.params.safeParse(req.params);
    if (result.success === false) {
      addError(result);
    } else {
      validated.params = result.data;
    }
  }
  if (schema.query) {
    const result = schema.query.safeParse(req.query);
    if (result.success === false) {
      addError(result);
    } else {
      validated.query = result.data;
    }
  }

  if (errorArray.length > 0) {
    throw new ApiError(400, "Request validation failed.", "VALIDATION_ERROR", errorArray);
  } else {
    req.validated = validated;
    next();
  }
};
