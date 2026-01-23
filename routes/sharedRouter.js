import express from "express";
import {
  addFileAccessController,
  filesSharedByUser,
  filesSharedWithUser,
  refuseFileAccessController,
  shareFileLinkController,
} from "../controllers/sharedController.js";

const sharedRouter = express.Router();

//*===============>  FETCHING FILE LINK
sharedRouter.get("/file/url/:fileID", shareFileLinkController);

//*===============>  ADD FILE ACCESS
sharedRouter.post("/file/access/add", addFileAccessController);

//*===============>  REVOKE FILE ACCESS
// sharedRouter.post("/file/access/revoke", refuseFileAccessController);

//*===============>  REFUSE FILE ACCESS
sharedRouter.post("/file/access/refuse", refuseFileAccessController);

//*===============>  FILES SHARED BY USER
sharedRouter.get("/file/by-user", filesSharedByUser);

//*===============>  FILES SHARED WITH USER
sharedRouter.get("/file/with-user", filesSharedWithUser);

export default sharedRouter;
