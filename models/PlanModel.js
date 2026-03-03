import { model, Schema } from "mongoose";
import BasicPlan from "../models/BasicPlan.json" with { type: "json" };

const planSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name field is required"],
      minLength: [3, "Plan name too short"],
      trim: true,
      unique: true,
    },
    description: String,
    price: {
      type: Number,
      required: [true, "Price field is required"],
    },
    planType: {
      type: String,
      enum: ["month", "year"],
      default: "month",
    },
    roleCode: {
      type: Number,
      required: [true, "Role code is required"],
    },
    usersList: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    razorpayID: { type: String },
    features: {
      type: [
        {
          feature: String,
          value: Boolean,
        },
      ],
      default: () => BasicPlan.features,
    },
  },
  {
    strict: "throw",
    timestamps: true,
  },
);

const Plan = model("Plan", planSchema);

export default Plan;
