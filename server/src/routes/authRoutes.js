import express from "express";
import { signUp, login } from "../validators/userValidator.js";
import { validateRequest } from "../middleware/zodMiddleware.js";
import {
  signUpController,
  loginController,
  refreshController,
  logoutController,
} from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signup", validateRequest({ body: signUp }), signUpController);
authRouter.post("/login", validateRequest({ body: login }), loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
export default authRouter;
