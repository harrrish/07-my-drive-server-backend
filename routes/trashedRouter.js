import express from "express";
import {
  getTrashedContents,
  moveFileToTrash,
  moveFolderToTrash,
  removeFileFromTrash,
  removeFolderFromTrash,
} from "../controllers/trashedController.js";

const trashedRouter = express.Router();

//*===============>  FETCHING TRASHED CONTENTS
trashedRouter.get("/contents", getTrashedContents);

//*===============>  MOVE FOLDER TO TRASH
trashedRouter.patch("/move/folder/:folderID", moveFolderToTrash);

//*===============>  REMOVE FOLDER FROM TRASH
trashedRouter.patch("/remove/folder/:folderID", removeFolderFromTrash);

//*===============>  MOVE FILE TO TRASH
trashedRouter.patch("/move/file/:fileID", moveFileToTrash);

//*===============>  REMOVE FILE FROM TRASH
trashedRouter.patch("/remove/file/:fileID", removeFileFromTrash);

export default trashedRouter;
