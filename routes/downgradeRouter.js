import express from "express";
import { downgradePlanController } from "../controllers/downgradeController.js";

const downgradeRouter = express.Router();

downgradeRouter.post("/", downgradePlanController);

export default downgradeRouter;
