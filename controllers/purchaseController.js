import Razorpay from "razorpay";
import UserModel from "../models/UserModel.js";
import PlanModel from "../models/PlanModel.js";
import { customErr, customResp } from "../utils/customReturn.js";

const rzpInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const webHookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export const addNewPlan = async (req, res, next) => {
  try {
    const plan = await PlanModel.create(req.body);
    if (plan) return customResp(res, 200, "Plan created successfully !");
  } catch (error) {
    console.error("Failed to add new plan:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

export const getUserPlan = async (req, res, next) => {
  try {
    const currentPlan = await PlanModel.findOne({
      name: req.user.role,
      roleCode: req.user.roleCode,
      _id: req.user.planCode,
    });

    let nextPlans = await PlanModel.find({
      roleCode: { $gt: req.user.roleCode },
    })
      .sort({ roleCode: 1 })
      .lean();

    nextPlans = nextPlans.map((p) => ({ ...p, userID: req.user._id }));

    return res.status(200).json({ currentPlan, nextPlans });
  } catch (error) {
    console.log(e);
    return customErr(res, 500, `Unable to fetch plan details !`);
  }
};

//* WITH RAZORPAY
export const upgradePlan = async (req, res, next) => {
  try {
    const planID = req.body.planID;
    const planName = req.body.planName;
    if (!planID)
      return customErr(res, 400, `Unable to purchase ${planName} plan !`);

    const plan = await PlanModel.findOne({
      name: planName,
      razorpayID: planID,
    });
    if (!plan)
      return customErr(res, 400, `Unable to purchase ${planName} plan !`);

    const newSubscription = await rzpInstance.subscriptions.create({
      plan_id: planID,
      total_count: 120,
      notes: {
        userID: req.user._id,
      },
    });

    // console.log(newSubscription.short_url);
    return res.status(201).json({ subscriptionID: newSubscription.id });
  } catch (error) {
    console.error("Failed to add new plan:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};

//* WITHOUT RAZORPAY
export const upgradePlanWO = async (req, res, next) => {
  try {
    const planID = req.body.planID;
    const planName = req.body.planName;
    if (!planID)
      return customErr(res, 400, `Unable to purchase ${planName} plan !`);

    const plan = await PlanModel.findOne({
      name: planName,
      razorpayID: planID,
    });
    if (!plan)
      return customErr(res, 400, `Unable to purchase ${planName} plan !`);

    const user = await UserModel.findById(req.user._id);
    if (plan.name === "PRO") {
      user.maxStorageInBytes = 1024 ** 3;
      user.role = "PRO";
      user.roleCode = 2;
      user.planCode = plan._id;
      user.roleValidity = Date.now() + 1000 * 60 * 60 * 24 * 30;
      await user.save();
    } else if (plan.name === "PREMIUM") {
      user.maxStorageInBytes = 1024 ** 3 * 10;
      user.role = "PREMIUM";
      user.roleCode = 3;
      user.planCode = plan._id;
      user.roleValidity = Date.now() + 1000 * 60 * 60 * 24 * 30;
      await user.save();
    }

    return res.status(201).json({ message: `Upgraded to ${planName} !` });
  } catch (error) {
    console.error("Failed to add new plan:", error);
    const errStr = "INTERNAL_SERVER_ERROR";
    return customErr(res, 500, errStr);
  }
};
