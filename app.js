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

const url1 = process.env.URL1;
const url2 = process.env.URL2;

const whitelist = [url1, url2];
console.log({ whitelist });

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
      message: "Welcome to UVDS!",
      developer: "Harish S",
      email: "harrrish1906@gmail.com",
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
