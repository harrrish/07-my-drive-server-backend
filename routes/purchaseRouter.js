import express from "express";
import {
  addNewPlan,
  getUserPlan,
  upgradePlan,
} from "../controllers/purchaseController.js";

const purchaseRouter = express.Router();

purchaseRouter.post("/addPlan", addNewPlan);
purchaseRouter.get("/", getUserPlan);
purchaseRouter.post("/", upgradePlan);

export default purchaseRouter;
