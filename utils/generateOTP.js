import OTP from "../models/OTPModel.js";
import { Resend } from "resend";
import { generateOTPHtml } from "./otpHtmlContent.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function generateOTP(email, username) {
  //* Generate otp
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  //* Save OTP in DB
  try {
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true },
    );
  } catch (err) {
    console.error("OTP DB error:", err);
    return {
      success: false,
      error: "Unable to generate OTP, Please try again later !",
    };
  }

  //* Send OTP in email
  try {
    const { data, error } = await resend.emails.send({
      from: `My-Drive <no-reply@uvds.store>`,
      to: [email],
      subject: "OTP for Verification from UVDS-My-Drive !",
      html: generateOTPHtml(username, otp),
    });

    if (!data?.id) {
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error("OTP email error:", err);
    return {
      success: false,
      error: "Something went wrong !",
    };
  }
}
