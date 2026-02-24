import express from "express";
import {
  addNewPlan,
  getUserPlan,
  purchasePremium,
  purchasePro,
} from "../controllers/purchaseController.js";

const purchaseRouter = express.Router();

purchaseRouter.post("/addPlan", addNewPlan);
purchaseRouter.get("/", getUserPlan);
purchaseRouter.post("/pro", purchasePro);
purchaseRouter.post("/premium", purchasePremium);

export default purchaseRouter;
