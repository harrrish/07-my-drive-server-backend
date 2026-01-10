import express from "express";
import { getStarredContents } from "../controllers/starredController.js";

const starredRouter = express.Router();

//*===============>  SENDING OTP
starredRouter.get("/", getStarredContents);

export default starredRouter;
