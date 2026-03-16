import OTP from "../models/OTPModel.js";
import UserModel from "../models/UserModel.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { generateOTP } from "../utils/generateOTP.js";
import { otpRequestSchema, otpVerifySchema } from "../utils/zodAuthSchemas.js";

export const requestOTP = async (req, res) => {
  try {
    const { success, data, error } = otpRequestSchema.safeParse(req.body);
    // console.log({ success }, { data }, { error });

    if (!success) return customErr(res, 400, "Provide valid name and email !");

    const { email } = data;
    const emailExists = await UserModel.findOne({ email });
    if (emailExists)
      return customErr(res, 400, "Sorry, User email already exists !");

    const otpSent = await generateOTP(data.email, data.name);
    if (otpSent.success) {
      return customResp(res, 201, `OTP sent to ${data.email} !`);
    } else {
      return customErr(res, 500, otpSent.error);
    }
  } catch (error) {
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};

export const requestOTPPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userExists = await UserModel.findOne({ email });
    if (!userExists)
      return customErr(res, 400, "Sorry, User email is not registered !");

    if (!userExists.password) return customErr(res, 400, "NO_PASSWORD_EXIST");

    const otpSent = await generateOTP(userExists.email, userExists.name);
    if (otpSent.success) {
      return customResp(res, 201, `OTP sent to ${userExists.email}`);
    } else {
      return customErr(res, 500, otpSent.error);
    }
  } catch (error) {
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { success, data } = otpVerifySchema.safeParse(req.body);
    if (!success) return customErr(res, 400, "Invalid OTP or Credentials !");

    const { email, otp } = data;
    // console.log(email, otp);

    const otpExpired = await OTP.findOne({ email });
    // console.log({ otpExpired });
    if (!otpExpired) return customErr(res, 400, "OTP Expired !");

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return customErr(res, 400, "Invalid Email or OTP !");
    else return customResp(res, 200, "OTP verification completed !");
  } catch (error) {
    console.error("OTP verification failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, "OTP verification failed !");
  }
};
