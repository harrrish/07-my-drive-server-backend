import express from "express";
import {
  addFileAccessController,
  filesSharedByUser,
  filesSharedToUser,
  removeFileAccessController,
  shareFileLinkController,
} from "../controllers/sharedController.js";

const sharedRouter = express.Router();

//*===============>  FETCHING FILE LINK
sharedRouter.get("/file/url/:fileID", shareFileLinkController);

//*===============>  ADD FILE ACCESS
sharedRouter.post("/file/access/add", addFileAccessController);

//*===============>  REMOVE FILE ACCESS
sharedRouter.post("/file/access/remove", removeFileAccessController);

//*===============>  FILES SHARED BY USER
sharedRouter.get("/file/by-user", filesSharedByUser);

//*===============>  FILES SHARED WITH USER
sharedRouter.post("/file/with-user", filesSharedToUser);

export default sharedRouter;
