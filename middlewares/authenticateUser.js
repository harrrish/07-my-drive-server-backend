import { redisClient } from "../configurations/redisConfig.js";
import { customErr } from "../utils/customReturn.js";
import { validateMongoID } from "../utils/validateMongoID.js";
import UserModel from "../models/UserModel.js";

export default async function authenticateUser(req, res, next) {
  try {
    const { sessionID } = req.signedCookies;

    if (!sessionID) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "INVALID_SESSION");
    }
    validateMongoID(res, sessionID);

    const redisKey = `session:${sessionID}`;
    const session = await redisClient.json.get(redisKey);
    if (!session) {
      console.log("AUTH_FAIL_NO_COOKIE", {
        time: new Date(),
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return customErr(res, 401, "INVALID_SESSION");
    }

    const user = await UserModel.findById({ _id: session.userID });
    if (!user) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "INVALID_SESSION");
    }

    //*===============> id, rootID, name, email, maxStorageInBytes, role, roleCode, isDeleted
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    res.clearCookie("sessionID");
    return customErr(res, 500, errStr);
  }
}
