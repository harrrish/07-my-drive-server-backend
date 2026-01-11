import DirectoryModel from "../models/DirectoryModel.js";
import FileModel from "../models/FileModel.js";
import { customErr } from "../utils/customReturn.js";

//*===============>  FETCHING TRASHED CONTENTS
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
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  ADD TO STAR FOLDER
export const moveFolderToTrash = async (req, res, next) => {
  console.log(req.user);
  try {
    const { id: userID } = req.user;
    // console.log({ userID });

    const folders = await DirectoryModel.find({
      userID,
      parentFID: currentDirID,
      isStarred: true,
      isTrashed: false,
    });

    const files = await FileModel.find({
      folderID: currentDirID,
      userID,
      isUploading: false,
      isStarred: true,
      isTrashed: false,
    });

    return res.status(200).json({
      files,
      folders,
      filesCount: filesCount.length,
      foldersCount: foldersCount.length,
    });
  } catch (error) {
    console.error("Failed to fetch folder content:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  REMOVE STAR FROM FOLDER
export const removeFolderFromTrash = async (req, res, next) => {
  console.log(req.user);
  try {
    const { id: userID } = req.user;
    // console.log({ userID });

    const folders = await DirectoryModel.find({
      userID,
      parentFID: currentDirID,
      isStarred: true,
      isTrashed: false,
    });

    const files = await FileModel.find({
      folderID: currentDirID,
      userID,
      isUploading: false,
      isStarred: true,
      isTrashed: false,
    });

    return res.status(200).json({
      files,
      folders,
      filesCount: filesCount.length,
      foldersCount: foldersCount.length,
    });
  } catch (error) {
    console.error("Failed to fetch folder content:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  ADD STAR TO FILE
export const moveFileToTrash = async (req, res, next) => {
  console.log(req.user);
  try {
    const { id: userID } = req.user;
    // console.log({ userID });

    const folders = await DirectoryModel.find({
      userID,
      parentFID: currentDirID,
      isStarred: true,
      isTrashed: false,
    });

    const files = await FileModel.find({
      folderID: currentDirID,
      userID,
      isUploading: false,
      isStarred: true,
      isTrashed: false,
    });

    return res.status(200).json({
      files,
      folders,
      filesCount: filesCount.length,
      foldersCount: foldersCount.length,
    });
  } catch (error) {
    console.error("Failed to fetch folder content:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  REMOVE STAR FROM FILE
export const removeFileFromTrash = async (req, res, next) => {
  console.log(req.user);
  try {
    const { id: userID } = req.user;
    // console.log({ userID });

    const folders = await DirectoryModel.find({
      userID,
      parentFID: currentDirID,
      isStarred: true,
      isTrashed: false,
    });

    const files = await FileModel.find({
      folderID: currentDirID,
      userID,
      isUploading: false,
      isStarred: true,
      isTrashed: false,
    });

    return res.status(200).json({
      files,
      folders,
      filesCount: filesCount.length,
      foldersCount: foldersCount.length,
    });
  } catch (error) {
    console.error("Failed to fetch folder content:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//* OLD CODE TRASH FILE
export const trashFile = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;

    if (!fileID) return customErr(res, 401, "Unable to move folder to trash !");
    if (fileID) validateMongoID(res, fileID);

    const { isTrashed } = req.body;
    // console.log({ isTrashed });

    const trashedFile = await FileModel.findOne({
      _id: fileID,
      userID,
    });
    // console.log(trashedFile);

    const fileParentFolderExists = await DirectoryModel.findById({
      _id: trashedFile.folderID,
    });
    // console.log(fileParentFolderExists);

    if (!fileParentFolderExists.isTrashed) {
      trashedFile.isTrashed = !isTrashed;
      await trashedFile.save();
    } else {
      return customErr(res, 401, "Folder may be deleted or Access denied");
    }

    if (!trashedFile) {
      return customErr(res, 401, "File Deleted or Access Denied !");
    } else {
      const currentFolder = await DirectoryModel.findById(trashedFile.folderID);
      if (isTrashed) currentFolder.filesCount += 1;
      else currentFolder.filesCount -= 1;
      await currentFolder.save();
      return customResp(
        res,
        201,
        `File "${trashedFile.name}" ${
          isTrashed ? "removed from" : "moved to"
        } trash !`,
      );
    }
  } catch (error) {
    console.error("File moving to trash failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//* OLD CODE TRASH FOLDER
export const trashDirectory = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const folderID = req.params.id;
    const { isTrashed } = req.body;

    if (!folderID)
      return customErr(res, 401, "Unable to move folder to trash !");
    if (folderID) validateMongoID(res, folderID);

    const trashedFolder = await DirectoryModel.findOne({
      _id: folderID,
      userID,
    });

    const parentFolderNotTrashed = await DirectoryModel.findOne({
      _id: trashedFolder.parentFID,
    });

    if (!parentFolderNotTrashed.isTrashed) {
      trashedFolder.isTrashed = !isTrashed;
      await trashedFolder.save();
    } else return customErr(res, 401, "Folder may be deleted or Access denied");

    // AndUpdate
    // { isTrashed: !isTrashed },

    if (!trashedFolder) {
      return customErr(res, 401, "Folder may be deleted or Access denied");
    } else {
      let currentFolder = await DirectoryModel.findById(
        trashedFolder.parentFID,
      );

      const foldersList = [];
      await trashDirectoryContents(currentFolder.id, foldersList);

      if (isTrashed) {
        currentFolder.foldersCount += 1;
        for await (const folderID of foldersList) {
          await DirectoryModel.findByIdAndUpdate(
            { _id: folderID },
            { isTrashed: false },
          );
        }
      } else {
        currentFolder.foldersCount -= 1;
        for await (const folderID of foldersList) {
          await DirectoryModel.findByIdAndUpdate(
            { _id: folderID },
            { isTrashed: true },
          );
        }
      }
      await currentFolder.save();
      // console.log(foldersList);

      return customResp(
        res,
        201,
        `Folder "${trashedFolder.name}" ${
          isTrashed ? "removed from" : "moved to"
        } trash !`,
      );
    }
  } catch (error) {
    console.error("Folder moving to trash failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
