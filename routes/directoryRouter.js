import express from "express";
import {
  createDirectory,
  deleteDirectory,
  getDirectoryContents,
  renameDirectory,
  searchDirectoryContents,
} from "../controllers/directoryControllers.js";

const directoryRouter = express.Router();

//*===============>  CREATING A NEW DIRECTORY
directoryRouter.post("{/:id}", createDirectory);

//*===============>  FETCHING FOLDERS & FILES
directoryRouter.get("{/:id}", getDirectoryContents);

//*===============>  FETCHING FOLDERS & FILES
directoryRouter.get("/search{/:id}", searchDirectoryContents);

//*===============>  RENAME A DIRECTORY
directoryRouter.patch("/rename/:id", renameDirectory);

//*===============>  DELETE A DIRECTORY
directoryRouter.delete("/delete/:id", deleteDirectory);

export default directoryRouter;
