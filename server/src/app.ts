import express from "express";
import cron from "node-cron";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

import router from "./routes/utilRoutes";
import { env } from "./env";
import { performDailyBackups } from "./utils/backupManager";
import { streamReader } from "./utils/streamReader";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Backup/Restore logging server!");
});
app.use("/api", router);

// Env config
const PORT = env.BACKUP_SERVICE_PORT || 4000;
const BASE_BACKUP_DIR = path.join(__dirname, "..", "temp", "backups");

const MONGO_URI_PRODUCTION = env.MONGO_URI_PRODUCTION;
const MONGO_URI_DEVELOPMENT = env.MONGO_URI_DEVELOPMENT;

if (!MONGO_URI_PRODUCTION || !MONGO_URI_DEVELOPMENT) {
  console.error(
    "Missing MONGO_URI_PRODUCTION or MONGO_URI_DEVELOPMENT in environment variables."
  );
  process.exit(1);
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.emit("welcome", "Connected to log server");

  // Start reading from Redis stream(s) to push logs to clients
  streamReader(io, "backup");
  streamReader(io, "restore");

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Backup service running on port ${PORT}`);
});

// ==============================
// CRON JOB for daily backups
// e.g. run at 1:00 AM server time
// ==============================
// cron.schedule("* * * * *", async () => {
//   // its scheduled to run at 1:00 AM
//   console.log("Daily backup job started...");
//   const requestId = crypto.randomUUID(); // generate a unique ID for this backup job
//   try {
//     await performDailyBackups(
//       BASE_BACKUP_DIR,
//       MONGO_URI_PRODUCTION,
//       MONGO_URI_DEVELOPMENT,
//       false,
//       requestId
//     );
//     console.log("Daily backup job completed successfully.");
//   } catch (error) {
//     console.error("Error in daily backup job:", error);
//   }
// });
