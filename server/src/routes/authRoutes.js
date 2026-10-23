import express from "express";
import { signUp, login } from "../validators/userValidator.js";
import { validateRequest } from "../middleware/zodMiddleware.js";
import { signUpController, loginController } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signup", validateRequest({ body: signUp }), signUpController);
authRouter.post("/login", validateRequest({ body: login }), loginController);
export default authRouter;
