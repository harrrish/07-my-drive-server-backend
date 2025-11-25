import express from "express";
import checkAuth from "../auth.js";
import {
  getUserDetails,
  getUserStorage,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);

userRouter.post("/login", loginUser);

userRouter.get("/profile", checkAuth, getUserDetails);

userRouter.get("/storage-details", checkAuth, getUserStorage);

userRouter.post("/logout", checkAuth, logoutUser);

export default userRouter;
