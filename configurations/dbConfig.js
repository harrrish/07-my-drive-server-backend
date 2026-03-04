import mongoose from "mongoose";

let cachedConnection = null;

export async function connectDB(context) {
  try {
    if (context) {
      context.callbackWaitsForEmptyEventLoop = false;
    }

    // reuse existing connection
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    const db = await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });

    cachedConnection = db;

    console.log("MongoDB connected:", db.connection.name);

    return db;

  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

/* connection lifecycle logs */
mongoose.connection.on("connected", () => {
  console.log("Mongoose connection established");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});
