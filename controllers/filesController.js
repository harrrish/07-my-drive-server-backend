import path from "node:path";
import mime from "mime";
import FileModel from "../models/FileModel.js";
import DirectoryModel from "../models/DirectoryModel.js";
import {
  createUploadSignedUrl,
  deleteS3File,
  getS3FileMetaData,
} from "../configurations/s3Config.js";
import { validateMongoID } from "../utils/validateMongoID.js";
import { editFolderSize } from "../utils/editFolderSize.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

//*===============>  INITIATE FILE UPLOAD
export const uploadFileInitiate = async (req, res) => {
  try {
    const filename = req.filename;
    const filesize = req.filesize;
    const currentDirID = req.currentDirID;
    const currentDirPath = req.currentDirPath;
    const userID = req.userID;
    const extension = path.extname(filename);
    const basename = path.basename(filename, extension);

    const insertedFile = await FileModel.create({
      extension,
      name: filename,
      basename,
      size: filesize,
      folderID: currentDirID,
      userID: userID,
      isUploading: true,
      path: { dirPath: currentDirPath, name: filename },
    });

    const contentType = mime.getType(filename) || "application/octet-stream";
    const uploadSignedUrl = await createUploadSignedUrl({
      key: `${insertedFile._id}${extension}`,
      contentType,
    });

    // console.log({ uploadSignedUrl });

    return res.status(200).json({ uploadSignedUrl, fileID: insertedFile.id });
  } catch (error) {
    console.error("Failed to start file upload:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  UPDATE FILE UPLOAD COMPLETE
export const uploadComplete = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const { fileID, size } = req.body;
    if (!fileID || !size) {
      res.clearCookie("sessionID");
      return customErr(res, 400, "Invalid file ID !");
    }
    if (fileID) validateMongoID(res, fileID);

    const file = await FileModel.findOne({ _id: fileID, userID });
    if (!file) return customErr(res, 404, "File Access denied or File deleted");

    const fileHeadData = await getS3FileMetaData(`${file.id}${file.extension}`);
    if (!fileHeadData) {
      await file.deleteOne();
      res.clearCookie("sessionID");
      return customErr(res, 400, "Corrupt/Deleted file");
    }
    if (fileHeadData.ContentLength !== size) {
      await file.deleteOne();
      res.clearCookie("sessionID");
      return customErr(res, 400, "File size altered");
    }

    file.isUploading = false;
    await file.save();

    const parentFolder = await DirectoryModel.findById(file.folderID);

    parentFolder.filesCount += 1;
    await parentFolder.save();
    editFolderSize(res, parentFolder, size, "inc");

    return customResp(res, 200, `File "${file.name}" upload complete`);
  } catch (error) {
    console.error("File upload failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  GET FILE CONTENT
export const getFile = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;

    if (!fileID) {
      res.clearCookie("sessionID");
      return customErr(res, 401, errorSession);
    }

    if (fileID) validateMongoID(res, fileID);

    const fileData = await FileModel.findOne({ _id: fileID, userID });
    if (!fileData)
      return customErr(res, 400, "File deleted or File access denied");

    const { name, extension } = fileData;
    console.log(name);
    const cloudfrontURL = process.env.CLOUDFRONT_URL;

    let url = "";

    if (req.query.action === "download") {
      const disposition = encodeURIComponent(`attachment; filename="${name}"`);
      url = `${cloudfrontURL}/${fileID}${extension}?response-content-disposition=${disposition}`;
    } else {
      url = `${cloudfrontURL}/${fileID}${extension}`;
    }

    console.log({ url });

    const cloudFrontUrl = getSignedUrl({
      url,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 1000 * 60), //* 60 seconds
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    console.log(`${process.env.CLOUDFRONT_URL}/${fileID}${extension}`);
    console.log(process.env.CLOUDFRONT_KEY_PAIR_ID);
    console.log(process.env.CLOUDFRONT_PRIVATE_KEY);

    console.log({ cloudFrontUrl });

    return res.redirect(cloudFrontUrl);
  } catch (error) {
    console.error("Failed to fetch file:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  RENAME FILE
export const renameFile = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;

    if (!fileID) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "Invalid file ID !");
    }

    if (fileID) validateMongoID(res, fileID);

    const { newName, basename } = req.body;
    if (!basename.trim()) return customErr(res, 400, "Invalid file name");

    const renamed = await FileModel.findOneAndUpdate(
      { _id: fileID, userID },
      { $set: { name: newName, basename } },
    );

    if (!renamed) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "File Deleted or Access Denied");
    } else
      return customResp(
        res,
        201,
        `File renamed from "${renamed.name}" to "${newName}"`,
      );
  } catch (error) {
    console.error("File rename failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

//*===============>  DELETE FILE
export const deleteFile = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;
    if (!fileID) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "Invalid file ID !");
    }
    if (fileID) validateMongoID(res, fileID);

    const fileData = await FileModel.findOne({ _id: fileID, userID });
    if (!fileData) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "File Deleted or Access Denied");
    }

    const { _id, folderID, extension, size } = fileData;
    const resp = await deleteS3File(`${fileData.id}${extension}`);
    if (resp.$metadata.httpStatusCode !== 204) {
      return customErr(res, 404, "File Deleted or Access Denied");
    }

    const isFileDeleted = await FileModel.deleteOne({ _id, userID });

    if (!isFileDeleted.acknowledged) {
      res.clearCookie("sessionID");
      return customErr(res, 401, "File Deleted or Access Denied");
    } else {
      const parentFolder = await DirectoryModel.findById(folderID);
      editFolderSize(res, parentFolder, size, "dec");
      return customResp(res, 201, `File "${fileData.name}" deleted`);
    }
  } catch (error) {
    console.error("File deletion failed:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
