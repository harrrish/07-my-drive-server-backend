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
  region: process.env.AWS_REGION || "ap-south-1", // ✅ add this line
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const createUploadSignedUrl = async ({ key, contentType }) => {
  const command = new PutObjectCommand({
    Bucket: "harisss-storage-app",
    Key: key,
    ContentType: contentType,
  });

  // console.log({ uploadCommand: command });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
    signableHeaders: new Set(["content-type"]),
  });
  // console.log({ uploadUrl: url });

  return url;
};

export const createGetSignedUrl = async ({
  key,
  download = false,
  filename,
}) => {
  const params = {
    Bucket: "harisss-storage-app",
    Key: key,
  };

  // Set Content-Disposition header
  if (download) {
    // Force download
    params.ResponseContentDisposition = `attachment; filename="${encodeURIComponent(
      filename,
    )}"`;
  } else {
    // Try to display inline - browser may still download based on file type
    params.ResponseContentDisposition = `inline; filename="${encodeURIComponent(
      filename,
    )}"`;
  }

  // You can optionally set ResponseContentType to help browser understand the file
  // But this depends on whether S3 has the Content-Type metadata set on the object
  const contentType = getMimeType(key);
  if (contentType) {
    params.ResponseContentType = contentType;
  }

  const command = new GetObjectCommand(params);

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  return url;
};

export const getS3FileMetaData = async (key) => {
  const command = new HeadObjectCommand({
    Bucket: "harisss-storage-app",
    Key: key,
  });

  const url = await s3Client.send(command);

  return url;
};

export const deleteS3File = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: "harisss-storage-app",
    Key: key,
  });

  const url = await s3Client.send(command);

  return url;
};

export const deleteS3Files = async (keys) => {
  const command = new DeleteObjectsCommand({
    Bucket: "harisss-storage-app",
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
