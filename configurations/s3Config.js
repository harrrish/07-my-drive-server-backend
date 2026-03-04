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

let s3Client;

if (process.env.NODE_ENV === "production") {
  // Lambda / production → use IAM role automatically
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1"
  });
} else {
  // Local development → use credentials from .env
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

export const createUploadSignedUrl = async ({ key, contentType }) => {
  try {
    const command = new PutObjectCommand({
      Bucket: "s3-uvds",
      Key: key,
      // ContentType: contentType
    });

    console.log("Generating presigned URL for key:", key);
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 300
      // signableHeaders: new Set(["content-type"])
    });

    console.log("Generated upload URL:", url);
    return url;

  } catch (error) {
    console.error("Failed to generate presigned upload URL");
    console.error("Error message:", error.message);
    console.error("Stack:", error.stack);
    throw new Error("Unable to generate upload URL");
  }
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

export { s3Client };
