import express from "express";
import { signUp, login } from "../validators/userValidator.js";
import { validateRequest } from "../middleware/zodMiddleware.js";
import {
  signUpController,
  loginController,
  refreshController,
  logoutController,
} from "../controllers/authController.js";
import {
  loginIPMiddleware,
  loginEmailMiddleware,
  signUpIPMiddleware,
} from "../middleware/rateLimiterMiddleware.js";
const authRouter = express.Router();

authRouter.post("/signup", validateRequest({ body: signUp }), signUpIPMiddleware, signUpController);
authRouter.post(
  "/login",
  validateRequest({ body: login }),
  loginIPMiddleware,
  loginEmailMiddleware,
  loginController,
);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
export default authRouter;
