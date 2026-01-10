import express from "express";
import {
  createDirectory,
  deleteDirectory,
  getDirectoryContents,
  renameDirectory,
  starDirectory,
  trashDirectory,
} from "../controllers/directoryControllers.js";

const directoryRouter = express.Router();

//*===============>  CREATING A NEW DIRECTORY
directoryRouter.post("{/:id}", createDirectory);

//*===============>  FETCHING FOLDERS & FILES
directoryRouter.get("{/:id}", getDirectoryContents);

//*===============>  RENAME A DIRECTORY
directoryRouter.patch("/rename/:id", renameDirectory);

//*===============>  STAR A DIRECTORY
directoryRouter.patch("/star/:id", starDirectory);

//*===============>  TRASH A DIRECTORY
directoryRouter.patch("/trash/:id", trashDirectory);

//*===============>  DELETE A DIRECTORY
directoryRouter.delete("/delete/:id", deleteDirectory);

export default directoryRouter;
