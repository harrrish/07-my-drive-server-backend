import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRouter from "./routes/directoryRouter.js";
import filesRouter from "./routes/filesRouter.js";
import userRouter from "./routes/userRouter.js";
import authRouter from "./routes/authRouter.js";
import checkAuth from "./auth.js";
import { connectDB } from "./config/dbConfig.js";
import { asyncHandler } from "./utils/asyncHandler.js";

connectDB();
const PORT = process.env.PORT || 4000;
const app = express();

const whitelist =
  process.env.NODE_ENV === "production"
    ? ["https://www.uvds.store", "https://uvds.store"]
    : ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());

app.get(
  "/",
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Welcome to UVDS-My Drive!",
      developer: "Harish S",
      email: "harrrish1906@gmail.com",
    });
  }),
);
app.post(
  "/frontend-github-webhook",
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      message: "OK",
    });
  }),
);

app.use("/user", userRouter);
app.use("/file", checkAuth, filesRouter);
app.use("/directory", checkAuth, directoryRouter);
app.use("/auth", authRouter);

app.listen(PORT, () =>
  console.log(`Express app running on PORT:${process.env.PORT} `),
);
