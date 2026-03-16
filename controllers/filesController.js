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
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

//*===============>  UPDATE FILE UPLOAD COMPLETE
export const uploadComplete = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const { fileID, size } = req.body;

    if (!fileID || !size) {
      return customErr(res, 400, "Unable to upload file !");
    }

    validateMongoID(res, fileID);

    const file = await FileModel.findOne({ _id: fileID, userID });
    if (!file) {
      return customErr(res, 404, "File not found !");
    }

    const key = `${file.id}${file.extension}`;

    // Fetch metadata from S3
    let fileHeadData = await getS3FileMetaData(key);

    // Retry once because S3 may not immediately expose metadata
    if (!fileHeadData) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      fileHeadData = await getS3FileMetaData(key);
    }

    if (!fileHeadData) {
      console.log("S3 metadata not found for:", key);
      await file.deleteOne();
      return customErr(res, 400, "Unable to upload file !");
    }

    const fileSize = Number(size);
    // console.log("S3 size:", fileHeadData.ContentLength);
    // console.log("Client size:", fileSize);

    if (fileHeadData.ContentLength !== fileSize) {
      console.log("File size mismatch");
      await file.deleteOne();
      return customErr(res, 400, "Unable to upload file !");
    }

    // Mark upload complete
    file.isUploading = false;
    file.size = fileSize;
    await file.save();

    const parentFolder = await DirectoryModel.findById(file.folderID);

    if (!parentFolder) {
      return customErr(res, 404, "Parent folder not found !");
    }

    parentFolder.filesCount += 1;
    await parentFolder.save();

    editFolderSize(res, parentFolder, fileSize, "inc");

    return customResp(res, 200, "File upload complete !");
  } catch (error) {
    console.error("File upload failed:", error);
    return customErr(res, 500, "INTERNAL_SERVER_ERROR");
  }
};
//*===============>  GET FILE CONTENT
export const getFile = async (req, res) => {
  try {
    // console.log("=== DEBUG ENV VARIABLES ===");
    // console.log("CLOUDFRONT_URL exists:", !!process.env.CLOUDFRONT_URL);
    // console.log("CLOUDFRONT_URL value:", process.env.CLOUDFRONT_URL);
    // console.log("CLOUDFRONT_KEY_PAIR_ID exists:",!!process.env.CLOUDFRONT_KEY_PAIR_ID);
    // console.log("CLOUDFRONT_PRIVATE_KEY exists:",!!process.env.CLOUDFRONT_PRIVATE_KEY);
    // console.log("CLOUDFRONT_PRIVATE_KEY length:",process.env.CLOUDFRONT_PRIVATE_KEY?.length);
    // console.log("=== END DEBUG ===");

    const { _id: userID } = req.user;
    const fileID = req.params.fileID;

    if (!fileID) {
      /* res.clearCookie("sessionID"); */
      return customErr(res, 400, "Unable to fetch file content !");
    }

    if (fileID) validateMongoID(res, fileID);

    const fileData = await FileModel.findOne({ _id: fileID, userID });
    if (!fileData) return customErr(res, 400, "File not found !");

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

    // console.log({ url });

    const cloudFrontUrl = getSignedUrl({
      url,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 1000 * 60), //* 60 seconds
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    // console.log({ cloudFrontUrl });
    // console.log("=== URL DEBUGGING ===");
    // console.log("cloudfrontURL from env:", cloudfrontURL);
    // console.log("Type of cloudfrontURL:", typeof cloudfrontURL);
    // console.log("Generated url:", url);
    // console.log("URL starts with:", url.substring(0, 10));

    return res.redirect(cloudFrontUrl);
  } catch (error) {
    console.error("Failed to fetch file:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

//*===============>  RENAME FILE
export const renameFile = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;

    if (!fileID) {
      /* res.clearCookie("sessionID"); */
      return customErr(res, 400, "Unable to rename file !");
    }

    if (fileID) validateMongoID(res, fileID);

    const { newName, basename } = req.body;
    if (!basename.trim()) return customErr(res, 400, "Invalid file name");

    const renamed = await FileModel.findOneAndUpdate(
      { _id: fileID, userID },
      { $set: { name: newName, basename } },
    );

    if (!renamed) {
      /* res.clearCookie("sessionID"); */
      return customErr(res, 400, "Unable to rename file !");
    } else return customResp(res, 201, `File rename successful !`);
  } catch (error) {
    console.error("File rename failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

//*===============>  DELETE FILE
export const deleteFile = async (req, res) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;
    if (!fileID) {
      /* res.clearCookie("sessionID"); */
      return customErr(res, 400, "Unable to delete file !");
    }
    if (fileID) validateMongoID(res, fileID);

    const fileData = await FileModel.findOne({ _id: fileID, userID });
    if (!fileData) {
      /* res.clearCookie("sessionID"); */
      return customErr(res, 400, "Unable to delete file !");
    }

    const { _id, folderID, extension, size } = fileData;
    const resp = await deleteS3File(`${fileData.id}${extension}`);
    if (resp.$metadata.httpStatusCode !== 204) {
      return customErr(res, 404, "Unable to delete file !");
    }

    const isFileDeleted = await FileModel.deleteOne({ _id, userID });

    if (!isFileDeleted.acknowledged) {
      /* res.clearCookie("sessionID"); */
      return customErr(res, 400, "Unable to delete file !");
    } else {
      const parentFolder = await DirectoryModel.findById(folderID);
      editFolderSize(res, parentFolder, size, "dec");
      return customResp(res, 201, `File "${fileData.name}" deleted`);
    }
  } catch (error) {
    console.error("File deletion failed:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};
