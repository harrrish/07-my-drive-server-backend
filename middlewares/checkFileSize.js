import UserModel from "../models/UserModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import { validateMongoID } from "../utils/validateMongoID.js";
import { customErr } from "../utils/customReturn.js";

export const checkFileSize = async (req, res, next) => {
  try {
    const { id, rootID, role } = req.user;
    const { name, size, folderID } = req.body;
    if (!name || !size) return customErr(res, 400, "Invalid file details");

    if (role === "BASIC") {
      if (size > 1024 * 1024) {
        // console.log("File size over 1 MB !");
        customErr(
          res,
          507,
          "Upgrade your plan to upload file larger than 1 MB !",
        );
        return res.destroy();
      }
    } else if (role === "PRO") {
      if (size > 1024 * 1024 * 3) {
        // console.log("File size over 5 MB !");
        customErr(
          res,
          507,
          "Upgrade your plan to upload file larger than 3 MB !",
        );
        return res.destroy();
      }
    } else if (role === "PREMIUM") {
      if (size > 1024 * 1024 * 5) {
        // console.log("File size over 10 MB !");
        customErr(res, 507, "Currently uploads above 5 MB not supported !");
        return res.destroy();
      }
    }

    const currentDirID = folderID ? folderID : rootID;

    if (rootID.toString() !== currentDirID.toString())
      validateMongoID(res, currentDirID);

    const currentDir = await DirectoryModel.findOne({
      _id: currentDirID,
      userID: id,
    });
    if (!currentDir) return customErr(res, 404, "Folder not found !");

    const reqUser = await UserModel.findById(id);
    const rootDir = await DirectoryModel.findById(rootID);
    // const remainingSpace = reqUser.maxStorageInBytes - rootDir.size;
    // if (size > remainingSpace) {
    //   customErr(res, 507, "File exceeds storage limit !");
    //   return res.destroy();
    // }

    //* Stopping user uploading more than 15 MB
    if (rootDir.size + size > 1024 * 1024 * 15) {
      customErr(res, 507, "OVERALL_LIMIT_EXCEEDED");
      return res.destroy();
    }

    req.filename = name;
    req.filesize = size;
    req.userID = id;
    req.user = reqUser;
    req.userRootDirID = rootID;
    req.userRootDir = rootDir;
    req.currentDirID = currentDirID;
    req.currentDir = currentDir;
    req.currentDirPath = currentDir.path;

    next();
  } catch (error) {
    console.error("Failed to verify file details:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};
