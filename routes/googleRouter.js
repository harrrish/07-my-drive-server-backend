import express from "express";
import {
  addGooglePassword,
  loginWithGoogle,
} from "../controllers/googleController.js";

const googleRouter = express.Router();

//*===============>  GOOGLE AUTH
googleRouter.post("/auth", loginWithGoogle);

//*===============>  GOOGLE AUTH
googleRouter.post("/add-password", addGooglePassword);

export default googleRouter;
