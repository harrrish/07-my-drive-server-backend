import UserModel from "../models/UserModel.js";
import { redisClient } from "../configurations/redisConfig.js";

export const downgradePlanController = async (req, res, next) => {
  const user = await UserModel.findById(req.user._id);
  user.maxStorageInBytes = 100 * 1024 ** 2;
  user.role = "BASIC";
  user.roleCode = 1;
  user.planCode = "69944c3da8fc29bb0a52272c";
  user.roleValidity = Date.now() + 1000 * 60 * 60 * 24 * 30;
  await user.save();

  const sessions = await redisClient.ft.search(
    "userIDIndex",
    `@userID:{${user._id.toString()}}`,
  );

  if (sessions.total > 0) {
    const keys = sessions.documents.map((doc) => doc.id);
    await redisClient.del(keys);
  }

  return res.status(201).json({ message: `Downgrade complete !` });
};
