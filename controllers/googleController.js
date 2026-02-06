import mongoose, { Types } from "mongoose";
import UserModel from "../models/UserModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import { verifyToken } from "../configurations/googleConfig.js";
import { redisClient } from "../configurations/redisConfig.js";
import { customErr, customResp } from "../utils/customReturn.js";

export const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;
    // console.log({ idToken });
    const userData = await verifyToken(idToken);
    const { name, picture, email, sub } = userData;
    const user = await UserModel.findOne({ email });
    //* REGISTER
    if (!user) {
      const mongooseSession = await mongoose.startSession();
      mongooseSession.startTransaction();
      const rootID = new Types.ObjectId();
      const userID = new Types.ObjectId();
      await UserModel.insertOne(
        {
          _id: userID,
          name,
          email,
          rootID,
          picture,
          sub,
        },
        { mongooseSession },
      );
      await DirectoryModel.insertOne(
        {
          _id: rootID,
          name: `root-${email}`,
          parentFID: null,
          userID,
          path: rootID,
        },
        { mongooseSession },
      );
      const sessionID = new Types.ObjectId();
      const redisSessionKey = `session:${sessionID}`;
      await redisClient.json.set(redisSessionKey, "$", {
        userID,
      });
      await redisClient.expire(redisSessionKey, 60 * 60 * 24);

      const redisUserDetails = `user:${userID}`;
      const ab = await redisClient.json.set(redisUserDetails, "$", {
        name,
        email,
        picture,
      });
      await redisClient.expire(redisUserDetails, 60 * 60);

      res.cookie("sessionID", sessionID, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        signed: true,
        maxAge: 60 * 60 * 1000,
      });
      mongooseSession.commitTransaction();
      return customResp(res, 201, "User signup complete");
    }
    //* LOGIN
    else {
      const sessionID = new Types.ObjectId();

      const redisKey = `session:${sessionID}`;
      await redisClient.json.set(redisKey, "$", {
        userID: user._id,
      });
      await redisClient.expire(redisKey, 60 * 60 * 24);
      const redisUserDetails = `user:${user._id}`;
      const ab = await redisClient.json.set(redisUserDetails, "$", {
        name: user.name,
        email: user.email,
        picture: user.picture,
      });
      await redisClient.expire(redisUserDetails, 60 * 60);

      res.cookie("sessionID", sessionID, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        signed: true,
        maxAge: 60 * 60 * 1000,
      });
      return customResp(res, 201, "User login complete");
    }
  } catch (error) {
    console.error("Login failed using Google:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
