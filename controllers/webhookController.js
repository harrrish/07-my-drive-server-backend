import Razorpay from "razorpay";
import UserModel from "../models/UserModel.js";
import PlanModel from "../models/PlanModel.js";
import { customErr, customResp } from "../utils/customReturn.js";

export const webhookController = async (req, res) => {
  //   console.log(req.body);
  const signature = req.headers["x-razorpay-signature"];
  const validatedSignature = Razorpay.validateWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );

  if (validatedSignature) {
    // console.log({ validatedSignature });
    if (req.body.event === "subscription.activated") {
      const userID = req.body.payload.subscription.entity.notes.userID;
      const razorpayPlanID = req.body.payload.subscription.entity.plan_id;

      const user = await UserModel.findById(userID);
      const previousPlanID = user.planCode;
      const newPlan = await PlanModel.findOne({ razorpayID: razorpayPlanID });

      if (previousPlanID) {
        const previousPlan = await PlanModel.findById(previousPlanID);
        if (previousPlan) {
          previousPlan.usersList = previousPlan.usersList.filter(
            (p) => p.toString() !== userID.toString(),
          );
          await previousPlan.save();
        }
      }

      user.role = newPlan.name;
      user.roleCode = newPlan.roleCode;
      user.planCode = newPlan._id;
      await user.save();

      newPlan.usersList.push(userID);
      await newPlan.save();

      console.log(`User "${user.name}" upgraded to "${newPlan.name}" !`);
      return res.status(200).send("OK");
    }
  } else {
    console.log("signature not valid");
  }
};

export const verifyUpdate = async (req, res) => {
  try {
    const { planName, userID } = req.body;
    const user = await UserModel.findById(userID);
    const planID = user.planCode;
    const planInfo = await PlanModel.findById(planID);

    if (user.role === planName) {
      return res.status(200).json({ message: "PURCHASE_VERIFIED", planInfo });
    }
    return res.status(200).json({ message: "pending" });
  } catch (error) {
    console.log(error);
    return customErr(res, 500, "INTERNAL_SERVER_ERROR !");
  }
};
