import express from "express";
import authenticateUser from "../middlewares/authenticateUser.js";
import {
  getUserData,
  getUserStorage,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);

userRouter.post("/login", loginUser);

userRouter.get("/profile", authenticateUser, getUserData);

userRouter.get("/storage-details", authenticateUser, getUserStorage);

userRouter.post("/logout", authenticateUser, logoutUser);

export default userRouter;
