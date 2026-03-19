import axios from "axios";
import { Types, mongoose } from "mongoose";
import UserModel from "../models/UserModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import OTPModel from "../models/OTPModel.js";
import PlanModel from "../models/PlanModel.js";
import { loginSchema, registerSchema } from "../utils/zodAuthSchemas.js";
import { redisClient } from "../configurations/redisConfig.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UAParser } from "ua-parser-js";
import { isPrivateIP } from "../utils/checkIP.js";
import { validateMongoID } from "../utils/validateMongoID.js";

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
    const plan = await PlanModel.findOne({ roleCode: 1, planType: "month" });
    const createdUser = await UserModel.insertOne(
      {
        _id: userID,
        name,
        email,
        password,
        rootID,
        roleCode: 1,
        planCode: plan.id,
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
    plan.usersList.push(createdUser.id);
    await plan.save();
    session.commitTransaction();
    return customResp(res, 201, "User registration complete !");
  } catch (error) {
    console.error("User registration failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { success, data, error } = loginSchema.safeParse(req.body);
    if (!success) return customErr(res, 400, "Invalid Credentials !");

    const { email, password } = data;
    // console.log({ email, password });

    const user = await UserModel.findOne({ email });
    if (!user) return customErr(res, 400, "Invalid Credentials !");

    const isPasswordValid = await user.comparePassword(password);
    // console.log(isPasswordValid);
    if (!isPasswordValid) return customErr(res, 400, "Invalid Credentials !");

    //* CHECKING EXISTING SESSION IN REDIS
    const sessionExists = await redisClient.ft.search(
      "userIDIndex",
      `@userID:{${user._id.toString()}}`,
    );

    if (
      (user.roleCode === 1 && sessionExists.total > 0) ||
      (user.roleCode === 2 && sessionExists.total > 1) ||
      (user.roleCode === 3 && sessionExists.total > 2)
    ) {
      // console.log(sessionExists.total);
      return customErr(res, 400, "LOGIN_LIMIT_EXCEEDED");
    } else {
      const sessionID = new Types.ObjectId();
      //* CREATING SESSION IN REDIS

      const parser = new UAParser(req.headers["user-agent"]);
      const ua = parser.getResult();

      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket?.remoteAddress ||
        req.ip;

      let geoLocation = null;

      if (!isPrivateIP(ip)) {
        const response = await axios.get(`https://ipwho.is/${ip}`);
        if (response.data.success) geoLocation = response.data;
      }

      const redisSessionKey = `session:${sessionID}`;
      await redisClient.json.set(redisSessionKey, "$", {
        userID: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleCode: user.roleCode,
        picture: user.picture,
        sessionMeta: {
          ip,
          browser: ua.browser.name,
          browserVersion: ua.browser.version,
          os: ua.os.name,
          osVersion: ua.os.version,
          device: ua.device.type || "desktop",
          loginTime: Date.now(),
        },
        "geo-location": geoLocation,
      });
      await redisClient.expire(redisSessionKey, 60 * 60 * 24);

      res.cookie("sessionID", sessionID.toString(), {
        httpOnly: true,
        sameSite: isProd ? "None" : "Lax",
        secure: isProd,
        signed: true,
        domain: isProd ? ".uvds.store" : undefined,
        maxAge: 60 * 60 * 1000,
      });

      return customResp(res, 200, "User login successful !");
    }
  } catch (error) {
    console.error("User login failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

export const loginUserActivity = async (req, res) => {
  try {
    // console.log(req.body);
    const email = req.body.email;

    const user = await UserModel.findOne({ email });

    //* SHOULD HANDLE THIS IN FRONTEND
    if (!user) return customErr(res, 400, "USER_NOT_ALLOWED");

    //* CHECKING EXISTING SESSION IN REDIS
    const sessionExists = await redisClient.ft.search(
      "userIDIndex",
      `@userID:{${user._id.toString()}}`,
    );

    if (
      (user.roleCode === 1 && sessionExists.total > 0) ||
      (user.roleCode === 2 && sessionExists.total > 1) ||
      (user.roleCode === 3 && sessionExists.total > 2)
    ) {
      // console.log(sessionExists.total);
      return res.status(200).json({ sessions: sessionExists });
    }
  } catch (error) {
    console.error("User login failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return customErr(res, 401, "INVALID_REQUEST");

    const otpExists = await OTPModel.findOne({ email, otp });
    console.log(otpExists);
    if (!otpExists)
      return customErr(res, 401, "OTP_EXPIRED_OR_INVALID_CREDENTIALS");

    user.password = password;
    await user.save();

    await OTPModel.deleteOne({ email });

    return customResp(
      res,
      200,
      "Password reset completed, Re-login with new password !",
    );
  } catch (error) {
    console.error("Password reset failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

export const deleteUserSession = async (req, res) => {
  try {
    const sessionID = req.params.id;
    const session = await redisClient.json.get(sessionID);

    if (!session) return customErr(res, 400, "Unable to delete session !");

    await redisClient.del(sessionID);

    return customResp(res, 201, "Session deleted !");
  } catch (error) {
    console.error("Failed to delete session:", error);
    return customErr(res, 500, INTERNAL_SERVER_ERROR);
  }
};

export const getUserProfileData = async (req, res) => {
  try {
    // console.log(req.user);
    // const redisKey = `user:${req.user.id}`;
    // const redisData = await redisClient.json.get(redisKey);
    // if (!redisData) return customErr(res, 500, "Invalid Session !");

    //* Finding User
    const {
      name,
      email,
      contactNumber,
      username,
      role,
      picture,
      maxStorageInBytes,
      roleCode,
      starredItems,
      trashedItems,
      sharedByMe,
      sharedWithMe,
    } = req.user;

    //* Finding Root folder
    const { size } = await DirectoryModel.findOne({
      userID: req.user.id,
      name: `root-${email}`,
    });

    const starredItemsCount = starredItems.length;
    const trashedItemsCount = trashedItems.length;
    const sharedByMeCount = sharedByMe.length;
    const sharedWithMeCount = sharedWithMe.length;

    return res.status(200).json({
      name,
      email,
      contactNumber,
      username,
      maxStorageInBytes,
      role,
      picture,
      size,
      roleCode,
      starredItemsCount,
      trashedItemsCount,
      sharedByMeCount,
      sharedWithMeCount,
    });
  } catch (error) {
    console.error("Fetching user details failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { sessionID } = req.signedCookies;
    const redisKey = `session:${sessionID}`;
    await redisClient.del(redisKey);
    const redisUserDetailsKey = `user:${req.user.id}`;
    await redisClient.del(redisUserDetailsKey);
    res.clearCookie("sessionID");
    return customResp(res, 201, "User logged out from the current device !");
  } catch (error) {
    console.error("Fetching user details failed:", error);
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};

export const logoutUserAll = async (req, res) => {
  try {
    const allSessions = await redisClient.ft.search(
      "userIDIndex",
      `@userID:{${req.user._id.toString()}}`,
    );

    if (allSessions.total === 0) return;

    const keys = allSessions.documents.map((doc) => doc.id);
    await redisClient.del(keys);

    return customResp(res, 201, "User logged out from all devices !");
  } catch (error) {
    console.error("Fetching user details failed:", error);
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};
