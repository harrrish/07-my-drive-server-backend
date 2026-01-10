import DirectoryModel from "../models/DirectoryModel.js";
import FileModel from "../models/FileModel.js";
import { customErr } from "../utils/customReturn.js";

//*===============>  FETCHING TRASH FOLDERS & FILES
export const getTrashedContents = async (req, res, next) => {
  try {
    const { id: userID } = req.user;

    const folders = await DirectoryModel.find({
      userID,
      isStarred: false,
      isTrashed: true,
    });

    const files = await FileModel.find({
      userID,
      isStarred: false,
      isTrashed: true,
    });

    return res.status(200).json({
      folders,
      foldersCount: folders.length,
      files,
      filesCount: files.length,
    });
  } catch (error) {
    console.error("Failed to trashed contents:", error);
    const errStr = "Internal Server Error: Failed to trashed contents";
    return customErr(res, 500, errStr);
  }
};
