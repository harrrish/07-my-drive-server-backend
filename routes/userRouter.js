import express from "express";
import authenticateUser from "../middlewares/authenticateUser.js";
import {
  deleteUserSession,
  getUserProfileData,
  loginUser,
  loginUserActivity,
  logoutUser,
  logoutUserAll,
  registerUser,
  resetPassword,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);

userRouter.post("/login", loginUser);

userRouter.post("/login-activity", loginUserActivity);

userRouter.post("/reset-password", resetPassword);

userRouter.delete("/delete-session/:id", deleteUserSession);

userRouter.get("/profile", authenticateUser, getUserProfileData);

userRouter.post("/logout", authenticateUser, logoutUser);

userRouter.post("/logout-all", authenticateUser, logoutUserAll);

export default userRouter;
