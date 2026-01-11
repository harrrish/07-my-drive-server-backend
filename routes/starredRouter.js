import express from "express";
import {
  addStarToFile,
  addStarToFolder,
  getStarredContents,
  removeStarFromFile,
  removeStarFromFolder,
} from "../controllers/starredController.js";

const starredRouter = express.Router();

//*===============>  FETCHING STARRED CONTENTS
starredRouter.get("/contents", getStarredContents);

//*===============>  ADD TO STAR FOLDER
starredRouter.patch("/add/folder/:folderID", addStarToFolder);

//*===============>  REMOVE STAR FROM FOLDER
starredRouter.patch("/remove/folder/:folderID", removeStarFromFolder);

//*===============>  ADD STAR TO FILE
starredRouter.patch("/add/file/:fileID", addStarToFile);

//*===============>  REMOVE STAR FROM FILE
starredRouter.patch("/remove/file/:fileID", removeStarFromFile);

export default starredRouter;
