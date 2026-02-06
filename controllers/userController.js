import { Types, mongoose } from "mongoose";
import UserModel from "../models/UserModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import OTPModel from "../models/OTPModel.js";
import { loginSchema, registerSchema } from "../utils/zodAuthSchemas.js";
import { redisClient } from "../configurations/redisConfig.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serialize } from "v8";

const isProd = process.env.NODE_ENV === "production";

export const registerUser = async (req, res) => {
  try {
    const { success, data, error } = registerSchema.safeParse(req.body);
    if (!success) return customErr(res, 400, error.issues[0].message);

    const { name, email, password, otp } = data;

    const emailExists = await UserModel.findOne({ email });
    if (emailExists) return customErr(res, 400, "User email exists !");

    const otpRecord = await OTPModel.findOne({ email, otp });
    if (!otpRecord)
      return customErr(res, 400, "Session Expired to create account !");
    await otpRecord.deleteOne();

    const session = await mongoose.startSession();
    session.startTransaction();
    const rootID = new Types.ObjectId();
    const userID = new Types.ObjectId();
    await UserModel.insertOne(
      {
        _id: userID,
        name,
        email,
        password,
        rootID,
      },
      { session },
    );
    await DirectoryModel.insertOne(
      {
        _id: rootID,
        name: `root-${email}`,
        parentFID: null,
        userID,
        path: rootID,
      },
      { session },
    );
    session.commitTransaction();
    return customResp(res, 201, "User registration complete !");
  } catch (error) {
    console.error("User registration failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { success, data, error } = loginSchema.safeParse(req.body);
    if (!success) return customErr(res, 400, "Invalid Credentials !");

    const { email, password } = data;

    const user = await UserModel.findOne({ email });
    if (!user) return customErr(res, 400, "Invalid Credentials !");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return customErr(res, 400, "Invalid Credentials !");

    const sessionID = new Types.ObjectId();
    const redisSessionKey = `session:${sessionID}`;
    await redisClient.json.set(redisSessionKey, "$", {
      userID: user._id,
    });
    await redisClient.expire(redisSessionKey, 60 * 60 * 24);

    const redisUserDetails = `user:${user.id}`;
    await redisClient.json.set(redisUserDetails, "$", {
      name: user.name,
      email: user.email,
      picture: user.picture,
    });
    await redisClient.expire(redisUserDetails, 60 * 60 * 24);

    // console.log({ isProd });

    res.cookie("sessionID", sessionID.toString(), {
      httpOnly: true,
      sameSite: isProd ? "None" : "Lax",
      secure: isProd,
      signed: true,
      domain: isProd ? ".uvds.store" : undefined,
      maxAge: 60 * 60 * 1000,
    });

    return customResp(res, 200, "User login successful !");
  } catch (error) {
    console.error("User login failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

export const getUserData = async (req, res) => {
  try {
    const redisKey = `user:${req.user.id}`;
    const redisData = await redisClient.json.get(redisKey);
    if (!redisData) return customErr(res, 500, "Invalid Session !");

    //* Finding User
    const { name, email, role, picture, maxStorageInBytes } = req.user;

    //* Finding Root folder
    const { size } = await DirectoryModel.findOne({
      userID: req.user.id,
      name: `root-${email}`,
    });

    return res.status(200).json({
      name,
      email,
      role,
      picture,
      size,
      maxStorageInBytes,
    });
  } catch (error) {
    console.error("Fetching user details failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

export const getUserStorage = async (req, res) => {
  try {
    const { rootID, maxStorageInBytes } = req.user;
    const { size } = await DirectoryModel.findById(rootID).select("size -_id");
    return res.status(200).json({ maxStorageInBytes, size });
  } catch (error) {
    console.error("Fetching user details failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

export const logoutUser = asyncHandler(async (req, res) => {
  const { sessionID } = req.signedCookies;
  const redisKey = `session:${sessionID}`;
  await redisClient.del(redisKey);
  const redisUserDetailsKey = `user:${req.user.id}`;
  await redisClient.del(redisUserDetailsKey);
  res.clearCookie("sessionID");
  return res.status(204).end();
});
