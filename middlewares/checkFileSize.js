import UserModel from "../models/UserModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import { validateMongoID } from "../utils/validateMongoID.js";
import { customErr } from "../utils/customReturn.js";

export const checkFileSize = async (req, res, next) => {
  try {
    const { id, rootID, role } = req.user;
    const { name, size, folderID } = req.body;
    if (!name || !size) return customErr(res, 400, "Invalid file details");

    if (role === "Basic") {
      if (size > 1024 * 1024) {
        // console.log("File size over 1 MB !");
        customErr(res, 507, "Free user cannot upload file larger than 1 MB !");
        return res.destroy();
      }
    } else if (role === "Pro") {
      if (size > 1024 * 1024 * 5) {
        // console.log("File size over 5 MB !");
        customErr(res, 507, "A Pro user cannot upload file larger than 5 MB !");
        return res.destroy();
      }
    } else if (role === "Premium") {
      if (size > 1024 * 1024 * 10) {
        // console.log("File size over 10 MB !");
        customErr(res, 507, "Files larger than 10 MB not supported !");
        return res.destroy();
      }
    }

    // if (size > 1024 * 1024 * 50) {
    //   console.log("File size over 50 mb !");
    //   customErr(res, 507, "File size over 50 mb !");
    //   return res.destroy();
    // }

    const currentDirID = folderID ? folderID : rootID;

    if (rootID.toString() !== currentDirID.toString())
      validateMongoID(res, currentDirID);

    const currentDir = await DirectoryModel.findOne({
      _id: currentDirID,
      userID: id,
    });
    if (!currentDir)
      return customErr(res, 404, "Folder deleted or Access denied");

    const reqUser = await UserModel.findById(id);
    const rootDir = await DirectoryModel.findById(rootID);

    const remainingSpace = reqUser.maxStorageInBytes - rootDir.size;
    if (size > remainingSpace) {
      customErr(res, 507, "File exceeds storage limit !");
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
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
