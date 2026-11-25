import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import { ensureSuperAdmin, seedJobs } from "./scripts/seedJobs.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import adminRoute from "./routes/admin.route.js";

dotenv.config({});
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "./uploads");

// app.get("/", (req, res) => {
//   return res.status(200).json({
//     message: "welcome to api",
//     timestamp: new Date().toISOString(),
//     success: true,
//   });
// });

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const normalizeOrigin = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (trimmed === "null") {
    return "null";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
);
const isProduction = process.env.NODE_ENV === "production";
const allowNullOrigin = process.env.ALLOW_NULL_ORIGIN === "true";

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!origin || (normalizedOrigin && allowedOrigins.has(normalizedOrigin))) {
      callback(null, true);
      return;
    }

    if (!isProduction && normalizedOrigin && isLocalDevOrigin(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    if (!isProduction && allowNullOrigin && normalizedOrigin === "null") {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use("/uploads", express.static(uploadsPath));

const PORT = process.env.PORT || 5001;

//api's
app.use("/api/user", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/job", jobRoute);
app.use("/api/application", applicationRoute);
app.use("/api/admin", adminRoute);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

const frontendDistPath = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

export default app;

const start = async () => {
  await connectDB();
  await ensureSuperAdmin();

  if (process.env.SEED_JOBS_ON_STARTUP !== "false") {
    try {
      await seedJobs({
        closeConnection: false,
        minimumJobs: 100,
        onlyWhenBelowMinimum: true,
      });
    } catch (error) {
      console.error("Startup seed check failed:", error.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectExecution) {
  start();
}
