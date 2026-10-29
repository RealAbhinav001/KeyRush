import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getMeController } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/me", requireAuth, getMeController);

export default userRouter;
