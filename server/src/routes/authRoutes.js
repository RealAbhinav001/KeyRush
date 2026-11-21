import express from "express";
import { signUpSchema,loginSchema } from "@keyrush/shared";
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

authRouter.post("/signup", validateRequest({ body: signUpSchema }), signUpIPMiddleware, signUpController);
authRouter.post(
  "/login",
  validateRequest({ body: loginSchema }),
  loginIPMiddleware,
  loginEmailMiddleware,
  loginController,
);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
export default authRouter;
