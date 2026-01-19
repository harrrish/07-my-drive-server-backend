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
  if (req.user.email === email) return customErr(res, 404, "Self share !");

  const checkUserPresent = await UserModel.findOne({
    email,
    isDeleted: false,
  });
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
  if (file.sharedWith.some((id) => id.equals(userFriend._id))) {
    return customErr(res, 400, "Access present !");
  }

  file.sharedWith.push({ userID: userFriend._id, email });
  await file.save();

  return customResp(res, 200, `File access shared to ${email} !`);
};

//* YET TO BE COMPLETED !
export const removeFileAccessController = async (req, res, next) => {
  const { email } = req.body;
  if (req.user.email === email) return customErr(res, 404, "Self share !");

  const checkUserPresent = await UserModel.findOne({
    email,
    isDeleted: false,
  });
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

  await FileModel.updateOne(
    { _id: file._id },
    { $addToSet: { sharedWith: userFriend._id } },
  );
};

export const filesSharedByUser = async (req, res, next) => {
  const files = await FileModel.find({
    userID: req.user._id,
    sharedWith: { $exists: true, $ne: [] },
  }).select("_id name sharedWith");

  //   console.log(files);
  return res.status(200).json({ files, filesCount: files.length });
};

export const filesSharedToUser = async (req, res, next) => {};
