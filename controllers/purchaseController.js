import UserModel from "../models/UserModel.js";
import PlanModel from "../models/PlanModel.js";
import { customResp } from "../utils/customReturn.js";

export const addNewPlan = async (req, res, next) => {
  const plan = await PlanModel.create(req.body);
  if (plan) return customResp(res, 200, "Plan created successfully !");
};

export const getUserPlan = async (req, res, next) => {
  // console.log(req.user);
  const currentPlan = await PlanModel.findOne({
    name: req.user.role,
    roleCode: req.user.roleCode,
    _id: req.user.planCode,
  });

  const nextPlans = await PlanModel.find({
    roleCode: { $gt: req.user.roleCode },
  }).sort({ roleCode: 1 });

  return res.status(200).json({ currentPlan, nextPlans });
};

export const purchasePro = async (req, res, next) => {
  return customResp(res, 200, `Reached pro purchase !`);
};

export const purchasePremium = async (req, res, next) => {
  return customResp(res, 200, `Reached premium purchase !`);
};
