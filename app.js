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
import homeRouter from "./routes/HomeRouter.js";

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

app.use("/", homeRouter);
app.use("/user", userRouter);
app.use("/file", authenticateUser, filesRouter);
app.use("/directory", authenticateUser, directoryRouter);
app.use("/star", authenticateUser, starredRouter);
app.use("/trash", authenticateUser, trashedRouter);
app.use("/share", authenticateUser, sharedRouter);
app.use("/otp", otpRouter);
app.use("/google", googleRouter);

app.listen(PORT, () =>
  console.log(`Express app running on PORT:${process.env.PORT} `),
);
