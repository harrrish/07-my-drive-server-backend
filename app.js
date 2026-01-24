import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRouter from "./routes/directoryRouter.js";
import filesRouter from "./routes/filesRouter.js";
import userRouter from "./routes/userRouter.js";
import otpRouter from "./routes/otpRouter.js";
import authenticateUser from "./middlewares/authenticateUser.js";
import { connectDB } from "./configurations/dbConfig.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import googleRouter from "./routes/googleRouter.js";
import starredRouter from "./routes/starredRouter.js";
import trashedRouter from "./routes/trashedRouter.js";
import sharedRouter from "./routes/sharedRouter.js";
import { spawn } from "child_process";

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

//* DEFAULT ENDPOINT
app.get(
  "/",
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Welcome to UVDS-My Drive!",
      developedBy: "Harish S",
      email: "harishs1906@outlook.com",
      contact: "7019412992",
    });
  }),
);

//* GITHUB WEBHOOK
//* SERVER
/* app.post("/server-github-webhook", (req, res) => {
  const bashChildProcess = spawn("bash", ["/usr/harish/server.sh"], {
    detached: true,
    stdio: "ignore",
  });

  bashChildProcess.unref();

  // bashChildProcess.stdout.on("data", (data) => {
  //   console.log(data.toString());
  // });

  // bashChildProcess.stderr.on("data", (data) => {
  //   console.log("Error Occured");
  //   process.stderr.write(data);
  // });

  bashChildProcess.on("close", (code) => {
    res.json({ message: "OK" });
    if (code === 0) {
      console.log("Script executed successfully !");
    } else {
      console.log("Script execution failed !");
    }
  });

  bashChildProcess.on("error", (data) => {
    res.json({ message: "OK" });
    console.log("Error while spawning");
    process.stderr.write(data);
  });

  res.status(200).json({ message: "Deployment success !!" });
}); */
//* BETTER VERSION
app.post("/server-github-webhook", (req, res) => {
  res.status(200).json({ message: "Server Deployment triggered" });

  console.log("Server-Code Deployment process started");

  const child = spawn("bash", ["/usr/harish/server.sh"]);

  child.stdout.on("data", (data) => {
    console.log("[SERVER DEPLOY STDOUT]", data.toString());
  });

  child.stderr.on("data", (data) => {
    console.error("[SERVER DEPLOY STDERR]", data.toString());
  });

  child.on("close", (code) => {
    console.log(`Backend deployment finished with code ${code}`);

    if (code === 0) {
      console.log("Backend deployment SUCCESS");
    } else {
      console.error("Backend deployment FAILED");
    }
  });
});

//* CLIENT
app.post("/client-github-webhook", (req, res) => {
  res.status(200).json({ message: "Client Deployment triggered" });
  console.log("Client-Code Deployment process started");

  const child = spawn("bash", ["/usr/harish/client.sh"]);

  child.stdout.on("data", (data) => {
    console.log("[CLIENT DEPLOY STDOUT]", data.toString());
  });

  child.stderr.on("data", (data) => {
    console.error("[CLIENT DEPLOY STDERR]", data.toString());
  });

  child.on("close", (code) => {
    console.log(`Frontend deployment finished with code ${code}`);

    if (code === 0) {
      console.log("Frontend deployment SUCCESS");
    } else {
      console.error("Frontend deployment FAILED");
    }
  });
});

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
