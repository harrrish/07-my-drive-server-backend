import DirectoryModel from "../models/DirectoryModel.js";
import FileModel from "../models/FileModel.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { trashDirectoryContents } from "../utils/trashDirectoryContents.js";

//*===============>  FETCHING TRASHED CONTENTS
export const getTrashedContents = async (req, res, next) => {
  try {
    const { id: userID } = req.user;

    const folders = await DirectoryModel.find({
      userID,
      isDeleted: true,
    });

    const files = await FileModel.find({
      userID,
      isDeleted: true,
    });

    return res.status(200).json({
      folders,
      foldersCount: folders.length,
      files,
      filesCount: files.length,
    });
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  MOVE FOLDER TO TRASH
export const moveFolderToTrash = async (req, res, next) => {
  try {
    const { id: userID } = req.user;
    // console.log({ userID });
    const folderID = req.params.folderID;

    const folder = await DirectoryModel.findOne({
      _id: folderID,
      userID,
      isTrashed: false,
      isDeleted: false,
    });

    if (!folder)
      return customErr(res, 400, "Folder deleted or Access denied !");

    folder.isTrashed = true;
    folder.isDeleted = true;

    const subFolderList = [];
    await trashDirectoryContents(folder.id, subFolderList);
    // console.log(subFolderList);
    await folder.save();

    const parentFolder = await DirectoryModel.findById({
      _id: folder.parentFID,
    });
    parentFolder.foldersCount -= 1;
    await parentFolder.save();

    for await (let folderID of subFolderList) {
      await DirectoryModel.findByIdAndUpdate(
        { _id: folderID, isDeleted: false },
        { isTrashed: true },
      );
    }
    return customResp(res, 201, `Folder "${folder.name}" moved to trash !`);
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  REMOVE FOLDER FROM TRASH
export const removeFolderFromTrash = async (req, res, next) => {
  try {
    const { id: userID } = req.user;
    // console.log({ userID });
    const folderID = req.params.folderID;

    const folder = await DirectoryModel.findOne({
      _id: folderID,
      userID,
    });
    // console.log(folder);
    if (!folder)
      return customErr(res, 400, "Parent folder is not accessible !");

    const folderParentNotTrashed = await DirectoryModel.findById({
      _id: folder.parentFID,
    });
    if (folderParentNotTrashed.isTrashed || folderParentNotTrashed.isDeleted) {
      return customErr(res, 400, "Parent folder is not accessible !");
    }

    folder.isTrashed = false;
    folder.isDeleted = false;

    const subFolderList = [];
    await trashDirectoryContents(folder.id, subFolderList);
    // console.log(subFolderList);
    await folder.save();

    const parentFolder = await DirectoryModel.findById({
      _id: folder.parentFID,
    });
    parentFolder.foldersCount += 1;
    await parentFolder.save();

    for await (let folderID of subFolderList) {
      const folder = await DirectoryModel.findById(folderID);
      if (!folder.isDeleted) folder.isTrashed = false;
      await folder.save();
    }
    return customResp(res, 201, `Folder "${folder.name}" removed to trash !`);
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  MOVE FILE TO TRASH
export const moveFileToTrash = async (req, res, next) => {
  try {
    const { id: userID } = req.user;
    // console.log({ userID });
    const fileID = req.params.fileID;

    const file = await FileModel.findOne({
      _id: fileID,
      userID,
      isTrashed: false,
      isDeleted: false,
    });

    if (!file) return customErr(res, 400, "File deleted or Access denied !");

    file.isStarred = false;
    file.isTrashed = true;
    file.isDeleted = true;

    await file.save();

    const parentFolder = await DirectoryModel.findById({ _id: file.folderID });
    parentFolder.filesCount -= 1;
    await parentFolder.save();

    return customResp(res, 201, `File "${file.name}" moved to trash !`);
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  REMOVE FILE FROM TRASH
export const removeFileFromTrash = async (req, res, next) => {
  try {
    const { id: userID } = req.user;
    // console.log({ userID });
    const fileID = req.params.fileID;

    const file = await FileModel.findOne({
      _id: fileID,
      userID,
      isTrashed: true,
      isDeleted: true,
    });

    if (!file) return customErr(res, 400, "File deleted or Access denied !");

    const fileParentNotTrashed = await DirectoryModel.findById({
      _id: file.folderID,
    });
    if (fileParentNotTrashed.isTrashed || fileParentNotTrashed.isDeleted) {
      return customErr(res, 400, "Folder containing file is not accessible !");
    }

    file.isStarred = false;
    file.isTrashed = false;
    file.isDeleted = false;

    await file.save();

    const parentFolder = await DirectoryModel.findById({
      _id: file.folderID,
    });
    parentFolder.filesCount += 1;
    await parentFolder.save();

    return customResp(res, 201, `File "${file.name}" removed to trash !`);
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
