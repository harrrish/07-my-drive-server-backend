import { customErr } from "../utils/customReturn.js";
import DirectoryModel from "../models/DirectoryModel.js";
import FileModel from "../models/FileModel.js";

//*===============>  FETCHING STARRED CONTENTS
export const getStarredContents = async (req, res, next) => {
  try {
    const { id: userID } = req.user;

    const folders = await DirectoryModel.find({
      userID,
      isStarred: true,
      isTrashed: false,
      isDeleted: false,
    });

    const files = await FileModel.find({
      userID,
      isStarred: true,
      isUploading: false,
      isTrashed: false,
      isDeleted: false,
    });

    return res.status(200).json({
      files,
      folders,
      filesCount: files.length,
      foldersCount: folders.length,
    });
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  ADD TO STAR FOLDER
export const addStarToFolder = async (req, res, next) => {
  try {
    const folderID = req.params.folderID;
    const { id: userID } = req.user;

    const folder = await DirectoryModel.findOne({
      _id: folderID,
      userID,
      isStarred: false,
      isTrashed: false,
      isDeleted: false,
    });

    if (!folder) {
      const errStr = "Internal Server Error";
      return customErr(res, 400, errStr);
    }

    folder.isStarred = true;
    await folder.save();

    // console.log(folder);
    return res
      .status(201)
      .json({ message: `Folder "${folder.name}" add to favorites !` });
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  REMOVE STAR FROM FOLDER
export const removeStarFromFolder = async (req, res, next) => {
  try {
    const folderID = req.params.folderID;
    const { id: userID } = req.user;

    const folder = await DirectoryModel.findOne({
      _id: folderID,
      userID,
      isStarred: true,
      isTrashed: false,
      isDeleted: false,
    });

    if (!folder) {
      const errStr = "Internal Server Error";
      return customErr(res, 400, errStr);
    }

    folder.isStarred = false;
    await folder.save();

    // console.log(folder);
    return res
      .status(201)
      .json({ message: `Folder "${folder.name}" removed from favorites !` });
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  ADD STAR TO FILE
export const addStarToFile = async (req, res, next) => {
  try {
    const fileID = req.params.fileID;
    const { id: userID } = req.user;

    const file = await FileModel.findOne({
      _id: fileID,
      userID,
      isStarred: false,
      isTrashed: false,
      isDeleted: false,
    });

    if (!file) {
      const errStr = "Internal Server Error";
      return customErr(res, 400, errStr);
    }

    file.isStarred = true;
    await file.save();

    // console.log(file);
    return res
      .status(201)
      .json({ message: `File "${file.name}" add to favorites !` });
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  REMOVE STAR FROM FILE
export const removeStarFromFile = async (req, res, next) => {
  try {
    const fileID = req.params.fileID;
    const { id: userID } = req.user;

    const file = await FileModel.findOne({
      _id: fileID,
      userID,
      isStarred: true,
      isTrashed: false,
      isDeleted: false,
    });

    if (!file) {
      const errStr = "Internal Server Error";
      return customErr(res, 400, errStr);
    }

    file.isStarred = false;
    await file.save();

    // console.log(file);
    return res
      .status(201)
      .json({ message: `File "${file.name}" removed from favorites !` });
  } catch (error) {
    console.error(error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
