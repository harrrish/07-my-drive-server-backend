import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRouter from "./routes/directoryRouter.js";
import filesRouter from "./routes/filesRouter.js";
import userRouter from "./routes/userRouter.js";
import otpRouter from "./routes/otpRouter.js";
import authenticateUser from "./middlewares/authenticateUser.js";
import { connectDB } from "./configurations/dbConfig.js";
import googleRouter from "./routes/googleRouter.js";
import starredRouter from "./routes/starredRouter.js";
import trashedRouter from "./routes/trashedRouter.js";
import sharedRouter from "./routes/sharedRouter.js";
import homeRouter from "./routes/homeRouter.js";
import purchaseRouter from "./routes/purchaseRouter.js";
import webhookRouter from "./routes/webhookRouter.js";
import downgradeRouter from "./routes/downgradeRouter.js";
connectDB();

const PORT = process.env.PORT || 4000;
const app = express();

const whitelist =
  process.env.NODE_ENV === "production"
    ? ["https://uvds.store", "https://www.uvds.store"]
    : ["http://localhost:5173"];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // console.log(`Origin received: ${origin}`);
    // console.log("NODE_ENV:", `${process.env.NODE_ENV}`);

    if (!origin) {
      // console.log("No origin, allowing request");
      return callback(null, true);
    }

    if (whitelist.includes(origin)) {
      // console.log(`Origin ${origin} is in whitelist`);
      return callback(null, true);
    }

    // console.log(`Blocked by CORS: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/v1/", homeRouter);
app.use("/v1/user", userRouter);
app.use("/v1/file", authenticateUser, filesRouter);
app.use("/v1/directory", authenticateUser, directoryRouter);
app.use("/v1/star", authenticateUser, starredRouter);
app.use("/v1/trash", authenticateUser, trashedRouter);
app.use("/v1/share", authenticateUser, sharedRouter);
app.use("/v1/otp", otpRouter);
app.use("/v1/google", googleRouter);

app.use("/v1/upgradePlan", authenticateUser, purchaseRouter);
app.use("/v1/downgradePlan", authenticateUser, downgradeRouter);
app.use("/v1/webhook", webhookRouter);

// start server only if NOT in production
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Express app running on PORT:${PORT}`);
  });
}

// always export app
export default app;
