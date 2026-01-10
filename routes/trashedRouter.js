import express from "express";
import { getTrashedContents } from "../controllers/trashedController.js";

const trashedRouter = express.Router();

//*===============>  SENDING OTP
trashedRouter.get("/", getTrashedContents);

export default trashedRouter;
