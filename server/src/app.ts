import express from "express";
import cors from "cors";
import cron from "node-cron";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import utilRoutes from "./routes/utilRoutes";
import healthRoutes from "./routes/healthRoutes";
import { env } from "./env";
import { performDailyBackups } from "./utils/backupManager";
import { streamReader } from "./utils/streamReader";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import {
  requestLoggerMiddleware,
  errorLoggerMiddleware,
} from "./utils/loggerMiddleware";
import { logInfo, logWarning, logError } from "./utils/logger";
import { v4 as uuidv4 } from "uuid";
import "newrelic";

const app = express();

// Initialize logging middleware before other middleware
app.use(requestLoggerMiddleware);

app.use(
  clerkMiddleware({
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
    debug: true, // For debugging Clerk's behavior
  })
);

const httpServer = createServer(app);

const CLIENT_ORIGIN_URL = env.CLIENT_ORIGIN_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [CLIENT_ORIGIN_URL],
    credentials: true,
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: `${CLIENT_ORIGIN_URL}`,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

app.get("/", (req, res) => {
  logInfo({
    message: "Root endpoint accessed",
    requestId: req.requestId,
    source: "GET /",
  });
  res.send("Hello from Backup/Restore logging server!");
});

app.use("/api", requireAuth(), utilRoutes);
app.use("/health", healthRoutes);

// Add error logger middleware after routes
app.use(errorLoggerMiddleware);

// Env config
const PORT = env.BACKUP_SERVICE_PORT || 4000;
const BASE_BACKUP_DIR = path.join(__dirname, "..", "temp", "backups");

const MONGO_URI_PRODUCTION = env.MONGO_URI_PRODUCTION;
const MONGO_URI_DEVELOPMENT = env.MONGO_URI_DEVELOPMENT;

if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
  logError({
    message:
      "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables.",
    source: "app-initialization",
  });
  process.exit(1);
}

io.on("connection", (socket) => {
  const connectionId = uuidv4();
  logInfo({
    message: `User connected: ${socket.id}`,
    requestId: connectionId,
    source: "socket.io",
  });

  socket.emit("welcome", "Connected to log server");

  // Start reading from Redis stream(s) to push logs to clients
  streamReader(io, "backup");
  streamReader(io, "restore");

  socket.on("disconnect", () => {
    logInfo({
      message: `User disconnected: ${socket.id}`,
      requestId: connectionId,
      source: "socket.io",
    });
  });
});

httpServer.listen(PORT, () => {
  logInfo({
    message: `Backup service running on port ${PORT}`,
    source: "app-initialization",
  });
});

// ==============================
// CRON JOB for daily backups
// e.g. run at 1:00 AM server time
// ==============================
cron.schedule("0 1 * * *", async () => {
  // run at 1:00 AM server time
  const requestId = uuidv4(); // generate a unique ID for this backup job
  logInfo({
    message: "Daily backup job started...",
    requestId,
    source: "cron-job",
    streamName: "backup",
  });

  try {
    await performDailyBackups(
      BASE_BACKUP_DIR,
      MONGO_URI_PRODUCTION,
      MONGO_URI_DEVELOPMENT,
      false,
      requestId
    );
    logInfo({
      message: "Daily backup job completed successfully.",
      requestId,
      source: "cron-job",
      streamName: "backup",
    });
  } catch (error) {
    logError({
      message: `Error in daily backup job: ${
        error instanceof Error ? error.message : String(error)
      }`,
      requestId,
      source: "cron-job",
      streamName: "backup",
    });
  }
});

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  logError({
    message: `Uncaught Exception: ${error.message}\nStack: ${error.stack}`,
    source: "process",
  });
  // Give logger time to write before exiting
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  logError({
    message: `Unhandled Rejection at: ${promise}\nReason: ${reason}`,
    source: "process",
  });
});
