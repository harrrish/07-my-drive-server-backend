import express from "express";
import {
  requestOTP,
  requestOTPPassword,
  verifyOTP,
} from "../controllers/otpController.js";

const otpRouter = express.Router();

//*===============>  SENDING OTP
otpRouter.post("/request", requestOTP);

//*===============>  SENDING OTP FOR PASSWORD RESET
otpRouter.post("/request-password", requestOTPPassword);

//*===============>  VERIFYING OTP
otpRouter.post("/verify", verifyOTP);

export default otpRouter;
