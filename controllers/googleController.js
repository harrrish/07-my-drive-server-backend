import mongoose, { Types } from "mongoose";
import UserModel from "../models/UserModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import { verifyToken } from "../configurations/googleConfig.js";
import { redisClient } from "../configurations/redisConfig.js";
import { customErr, customResp } from "../utils/customReturn.js";
import bcrypt from "bcrypt";

export const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;
    // console.log({ idToken });
    const userData = await verifyToken(idToken);
    const { name, picture, email, sub } = userData;
    const user = await UserModel.findOne({ email });
    //* REGISTER USER
    if (!user) {
      const mongooseSession = await mongoose.startSession();
      mongooseSession.startTransaction();
      const rootID = new Types.ObjectId();
      const userID = new Types.ObjectId();
      const user = await UserModel.insertOne(
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
      //* CREATING SESSION IN REDIS
      const redisSessionKey = `session:${sessionID}`;
      await redisClient.json.set(redisSessionKey, "$", {
        userID,
        name: user.name,
        email: user.email,
        role: user.role,
        roleCode: user.roleCode,
        picture: user.picture,
      });
      await redisClient.expire(redisSessionKey, 60 * 60 * 24);

      res.cookie("sessionID", sessionID, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        signed: true,
        maxAge: 60 * 60 * 1000,
      });
      mongooseSession.commitTransaction();
      return res.status(201).json({
        message: "GOOGLE",
        password: user.password ? true : false,
        email: user.email,
      });
    }
    //* LOGIN USER
    else {
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
        return res.status(400).json({ error: "LOGIN_LIMIT_EXCEEDED", email });
      } else {
        const sessionID = new Types.ObjectId();
        //* CREATING SESSION IN REDIS
        const redisSessionKey = `session:${sessionID}`;
        await redisClient.json.set(redisSessionKey, "$", {
          userID: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleCode: user.roleCode,
          picture: user.picture,
        });
        await redisClient.expire(redisSessionKey, 60 * 60 * 24);

        res.cookie("sessionID", sessionID, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          signed: true,
          maxAge: 60 * 60 * 1000,
        });
        return res.status(201).json({
          message: "GOOGLE",
          password: user.password ? true : false,
          email: user.email,
        });
      }
    }
  } catch (error) {
    console.error("Login failed using Google:", error);
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};

export const addGooglePassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log({ email, password });

    const user = await UserModel.findOne({ email });
    if (!user) return customErr(res, 400, "INVALID_USER");

    user.password = password;
    await user.save();

    return customResp(res, 201, "PASSWORD_ADDED");
  } catch (error) {
    console.error("Login failed using Google:", error);
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};
