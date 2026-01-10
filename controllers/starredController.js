import DirectoryModel from "../models/DirectoryModel.js";
import FileModel from "../models/FileModel.js";
import { customErr } from "../utils/customReturn.js";

//*===============>  FETCHING STARRED FOLDERS & FILES
export const getStarredContents = async (req, res, next) => {
  try {
    const { id: userID } = req.user;
    // console.log({ userID });

    const folders = await DirectoryModel.find({
      userID,
      isStarred: true,
      isTrashed: false,
    });

    const files = await FileModel.find({
      userID,
      isUploading: false,
      isStarred: true,
      isTrashed: false,
    });

    return res.status(200).json({
      folders,
      foldersCount: folders.length,
      files,
      filesCount: files.length,
    });
  } catch (error) {
    console.error("Failed to starred contents:", error);
    const errStr = "Internal Server Error: Failed to starred contents";
    return customErr(res, 500, errStr);
  }
};
