import express from "express";
import { requestOTP, verifyOTP } from "../controllers/otpController.js";

const otpRouter = express.Router();

//*===============>  SENDING OTP
otpRouter.post("/request", requestOTP);

//*===============>  VERIFYING OTP
otpRouter.post("/verify", verifyOTP);

export default otpRouter;
