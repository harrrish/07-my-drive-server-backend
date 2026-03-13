import express from "express";
import {
  addNewPlan,
  getUserPlan,
  upgradePlan,
  upgradePlanWO,
} from "../controllers/purchaseController.js";

const purchaseRouter = express.Router();

purchaseRouter.post("/addPlan", addNewPlan);
purchaseRouter.get("/", getUserPlan);

//* WITH RAZORPAY
// purchaseRouter.post("/", upgradePlan);

//* WITHOUT RAZORPAY
purchaseRouter.post("/", upgradePlanWO);

export default purchaseRouter;
