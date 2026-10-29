export const unauthenticatedError = () => {
  const err = new Error("Authentication Required");
  err.code = "UNAUTHENTICATED";
  return err;
};
