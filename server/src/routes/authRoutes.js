import express from "express";
import { signUp } from "../validators/userValidator.js";
import { validateRequest } from "../middleware/zodMiddleware.js";
import { signUpController } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signup", validateRequest({ body: signUp }), signUpController);

export default authRouter;
