import express from "express";
import {
  deleteFile,
  getFile,
  renameFile,
  uploadComplete,
  uploadFileInitiate,
} from "../controllers/filesController.js";
import { checkFileSize } from "../middlewares/checkFileSize.js";

const filesRouter = express.Router();

//*===============>  INITIATE FILE UPLOAD
filesRouter.post("/upload/initiate", checkFileSize, uploadFileInitiate);

//*===============>  UPDATE FILE UPLOAD COMPLETE
filesRouter.post("/upload/complete", uploadComplete);

//*===============>  GET FILE CONTENT
filesRouter.get("/:fileID", getFile);

//*===============>  RENAME FILE
filesRouter.patch("/rename/:fileID", renameFile);

//*===============>  DELETE FILE
filesRouter.delete("/delete/:fileID", deleteFile);

export default filesRouter;
