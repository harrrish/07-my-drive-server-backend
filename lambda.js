import serverless from "serverless-http";
import app from "./app.js";

import { connectDB } from "./configurations/dbConfig.js";
connectDB();

export const handler = serverless(app);
