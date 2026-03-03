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
  } catch (e) {
    console.error("Failed to add new plan:", error);
    const errStr = "Internal Server Error";
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
  } catch (e) {
    console.log(e);
    return customErr(res, 500, `Unable to fetch plan details !`);
  }
};

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
  } catch (e) {
    console.error("Failed to add new plan:", error);
    const errStr = "Internal Server Error";
    return customErr(res, 500, errStr);
  }
};

/* 
{
  "_id": {
    "$oid": "69944c7ca8fc29bb0a522739"
  },
  "name": "PRO",
  "description": "Unlock enhanced storage, secure sharing, and powerful file management features for improved productivity.",
  "price": 50,
  "planType": "month",
  "roleCode": 2,
  "usersList": [],
  "features": [
    {
      "feature": "1 GB secure cloud storage",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a52273a"
      }
    },
    {
      "feature": "Upload files up to 50 MB per file",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a52273b"
      }
    },
    {
      "feature": "Priority email support",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a52273c"
      }
    },
    {
      "feature": "Full group collaboration and project access",
      "value": false,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a52273d"
      }
    },
    {
      "feature": "Access on up to three personal devices",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a52273e"
      }
    },
    {
      "feature": "Secure file sharing via links",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a52273f"
      }
    },
    {
      "feature": "File starring",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a522740"
      }
    },
    {
      "feature": "Bulk delete functionality",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a522741"
      }
    },
    {
      "feature": "Bulk move files and folders",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a522742"
      }
    },
    {
      "feature": "File search",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a522743"
      }
    },
    {
      "feature": "File sorting",
      "value": true,
      "_id": {
        "$oid": "69944c7ca8fc29bb0a522744"
      }
    }
  ],
  "createdAt": {
    "$date": "2026-02-17T11:09:48.158Z"
  },
  "updatedAt": {
    "$date": "2026-02-17T11:09:48.158Z"
  },
  "__v": 0,
  "razorpayID": "plan_SMM9nCe5tC8iqQ"
}

*/
