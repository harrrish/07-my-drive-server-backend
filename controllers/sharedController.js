import FileModel from "../models/FileModel.js";
import UserModel from "../models/UserModel.js";
import { validateMongoID } from "../utils/validateMongoID.js";
import { customErr, customResp } from "../utils/customReturn.js";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

export const shareFileLinkController = async (req, res, next) => {
  try {
    const { _id: userID } = req.user;
    const fileID = req.params.fileID;
    if (!fileID) {
      res.clearCookie("sessionID");
      return customErr(res, 401, errorSession);
    }
    if (fileID) validateMongoID(res, fileID);
    const fileData = await FileModel.findOne({ _id: fileID, userID });
    // console.log(fileData);
    if (!fileData)
      return customErr(res, 400, "File deleted or File access denied");
    const { name, extension } = fileData;
    // console.log(name);

    const cloudfrontURL = process.env.CLOUDFRONT_URL;
    let url = `${cloudfrontURL}/${fileID}${extension}`;

    // console.log(url);

    const cloudFrontUrl = getSignedUrl({
      url,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 1000 * 60 * 60), //* 1 Hour
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    return customResp(res, 200, cloudFrontUrl);
  } catch (error) {
    console.error("Failed to fetch file:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

export const addFileAccessController = async (req, res, next) => {
  const { email } = req.body;
  const checkUserPresent = await UserModel.findOne({
    email,
    isDeleted: false,
  });

  if (req.user._id.equals(checkUserPresent._id))
    return customErr(res, 404, "Self share !");

  if (!checkUserPresent)
    return customErr(res, 404, "Email ID could not be found !");

  const { _id } = req.body;
  const file = await FileModel.findOne({
    _id,
    userID: req.user.id,
  });
  if (!file) {
    return customErr(res, 400, "File not found or Access denied !");
  }

  const userFriend = await UserModel.findOne({ email });
  if (file.sharedTo.some((id) => id.equals(userFriend._id))) {
    return customErr(res, 400, "Access present !");
  }

  file.sharedTo.push({ userID: userFriend._id, email });
  await file.save();

  userFriend.receivedContent.push(file._id);
  await userFriend.save();

  return customResp(res, 200, `File access shared to ${email} !`);
};

export const refuseFileAccessController = async (req, res, next) => {
  const currentUserID = req.user._id;
  const { fileID, userID: ownerID } = req.body;

  //* ACCESS REMOVED IN FILE
  const fileExists = await FileModel.findOne({
    _id: fileID,
    userID: ownerID,
  });
  if (!fileExists)
    return customErr(res, 400, "File not found or Access denied !");
  const indexInFile = fileExists.sharedTo.findIndex((f) =>
    f.userID.equals(currentUserID),
  );
  //   console.log(indexInFile);
  if (indexInFile === -1)
    return customErr(res, 400, "File not found or Access denied !");

  //* ACCESS REMOVED IN FILE
  const userReceived = await UserModel.findById(currentUserID);
  const indexInUser = userReceived.receivedContent.findIndex((v) =>
    v.equals(fileID),
  );

  if (indexInUser === -1)
    return customErr(res, 400, "File not found or Access denied !");
  fileExists.sharedTo.splice(indexInFile, 1);
  await fileExists.save();

  userReceived.receivedContent.splice(indexInFile, 1);
  await userReceived.save();

  return customResp(res, 200, `Access refused by ${userReceived.name} !`);
};

export const filesSharedByUser = async (req, res, next) => {
  try {
    const files = await FileModel.find({
      userID: req.user._id,
      sharedTo: { $exists: true, $ne: [] },
    }).select("_id name sharedTo");
    return res.status(200).json({ files, filesCount: files.length });
  } catch (error) {
    console.error("Failed to fetch file:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

export const filesSharedWithUser = async (req, res, next) => {
  try {
    const filesList = req.user.receivedContent;
    const files = [];
    for await (const fileID of filesList) {
      //   console.log({ fileID });
      const fileInfo = await FileModel.findById(fileID);
      //   console.log({ fileInfo });
      const userInfo = await UserModel.findOne({
        _id: fileInfo.userID,
      });
      files.push({
        fileID: fileInfo._id,
        filename: fileInfo.name,
        userID: userInfo._id,
        userEmail: userInfo.email,
      });
    }
    //   console.log({ files });
    return res.status(200).json({ files, filesCount: files.length });
  } catch (error) {
    console.error("Failed to fetch file:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};
