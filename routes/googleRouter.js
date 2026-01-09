import express from "express";
import { loginWithGoogle } from "../controllers/googleController.js";

const googleRouter = express.Router();

//*===============>  GOOGLE AUTH
googleRouter.post("/auth", loginWithGoogle);

export default googleRouter;
