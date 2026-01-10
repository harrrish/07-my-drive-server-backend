import OTP from "../models/OTPModel.js";
import UserModel from "../models/UserModel.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { generateOTP } from "../utils/generateOTP.js";
import { otpRequestSchema, otpVerifySchema } from "../utils/zodAuthSchemas.js";

export const requestOTP = async (req, res) => {
  const { success, data, error } = otpRequestSchema.safeParse(req.body);
  // console.log({ success }, { data }, { error });

  if (!success) return customErr(res, 400, "Invalid credentials !");

  const { email } = data;
  const emailExists = await UserModel.findOne({ email });
  if (emailExists)
    return customErr(res, 400, "Sorry, User email already exists !");

  const otpSent = await generateOTP(data.email, data.name);
  if (otpSent.success) {
    return customResp(res, 201, `OTP sent to ${data.email}`);
  } else {
    return customErr(res, 500, otpSent.error);
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { success, data } = otpVerifySchema.safeParse(req.body);
    if (!success) return customErr(res, 400, "Invalid OTP or Credentials !");

    const { email, otp } = data;
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return customErr(res, 400, "Invalid Email or OTP !");
    else return customResp(res, 200, "OTP verification completed !");
  } catch (error) {
    console.error("OTP verification failed:", error);
    const errStr = "Internal Server Error: OTP verification failed";
    return customErr(res, 500, "OTP verification failed !");
  }
};
