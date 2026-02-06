import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mime from "mime-types";

function getMimeType(key) {
  return mime.lookup(key) || "application/octet-stream";
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const createUploadSignedUrl = async ({ key, contentType }) => {
  const command = new PutObjectCommand({
    Bucket: "s3-uvds",
    Key: key,
    // ContentType: contentType,
  });

  console.log({ uploadCommand: command });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
    // signableHeaders: new Set(["content-type"]),
  });
  console.log({ uploadUrl: url });

  return url;
};

export const createGetSignedUrl = async ({
  key,
  download = false,
  filename,
}) => {
  const params = {
    Bucket: "s3-uvds",
    Key: key,
    ResponseContentDisposition: `${
      download ? "attachment" : "inline"
    };filename=${encodeURI(filename)}`,
  };

  const command = new GetObjectCommand(params);
  // console.log({ params });
  // console.log({ command });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 30,
  });

  return url;
};

export const getS3FileMetaData = async (key) => {
  const command = new HeadObjectCommand({
    Bucket: "s3-uvds",
    Key: key,
  });

  const url = await s3Client.send(command);

  return url;
};

export const deleteS3File = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: "s3-uvds",
    Key: key,
  });

  const url = await s3Client.send(command);

  return url;
};

export const deleteS3Files = async (keys) => {
  const command = new DeleteObjectsCommand({
    Bucket: "s3-uvds",
    Delete: {
      Objects: keys,
      Quiet: false, //*===============>  set true to skip individual delete responses
    },
  });
  // console.log({ deleteCommand: command });
  const url = await s3Client.send(command);
  // console.log({ deleteUrl: url });
  return url;
};
