import express from "express";
import {
  verifyUpdate,
  webhookController,
} from "../controllers/webhookController.js";

const webhookRouter = express.Router();

webhookRouter.post("/razorpay", webhookController);

webhookRouter.post("/verify", verifyUpdate);

export default webhookRouter;
