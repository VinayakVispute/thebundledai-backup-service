// apps/backup-service/src/routes.ts
import { Router } from "express";
import fs from "fs";
import path from "path";
import { performDailyBackups } from "../utils/backupManager";
import { restoreDatabase } from "../utils/restore";

const router = Router();

// Load from environment or .env
const BASE_BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(__dirname, "backups");
const MONGO_URI_PRODUCTION =
  process.env.MONGO_URI_PRODUCTION ||
  "mongodb+srv://officialfounderfeed:officialfounderfeed@cluster0.tupwyg6.mongodb.net";
const MONGO_URI_DEVELOPMENT =
  process.env.MONGO_URI_DEVELOPMENT ||
  "mongodb+srv://officialfounderfeed:officialfounderfeed@cluster0.tupwyg6.mongodb.net";

/**
 * POST /api/manual-backup
 * Manually trigger the backup logic for both production and development.
 */
//@ts-ignore
router.post("/manual-backup", async (req, res) => {
  try {
    await performDailyBackups(
      BASE_BACKUP_DIR,
      MONGO_URI_PRODUCTION,
      MONGO_URI_DEVELOPMENT
    );
    return res.json({ message: "Manual backup triggered successfully." });
  } catch (error) {
    console.error("Error in manual backup:", error);
    return res.status(500).json({ error: "Manual backup failed." });
  }
});

/**
 * GET /api/backups
 * Lists all dated directories under BACKUP_DIR,
 * plus indicates if production / development subfolders exist.
 */
//@ts-ignore
router.get("/backups", (req, res) => {
  try {
    if (!fs.existsSync(BASE_BACKUP_DIR)) {
      return res.json([]);
    }

    const dates = fs
      .readdirSync(BASE_BACKUP_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    const backupList = dates.map((dateFolder) => {
      const productionExists = fs.existsSync(
        path.join(BASE_BACKUP_DIR, dateFolder, "production")
      );
      const developmentExists = fs.existsSync(
        path.join(BASE_BACKUP_DIR, dateFolder, "development")
      );

      return {
        date: dateFolder,
        production: productionExists,
        development: developmentExists,
      };
    });

    return res.json(backupList);
  } catch (error) {
    console.error("Error listing backups:", error);
    return res.status(500).json({ error: "Failed to list backups." });
  }
});

/**
 * POST /api/restore
 * Body: { date, dbName, collections? (array) }
 */
//@ts-ignore
router.post("/restore", async (req, res) => {
  try {
    const { date, dbName, collections } = req.body;
    if (!date || !dbName) {
      return res.status(400).json({ error: "Missing date or dbName." });
    }

    const backupPath = path.join(BASE_BACKUP_DIR, date, dbName);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: "Backup path not found." });
    }

    let mongoUri = "";
    if (dbName === "production") {
      mongoUri = MONGO_URI_PRODUCTION;
    } else if (dbName === "development") {
      mongoUri = MONGO_URI_DEVELOPMENT;
    } else {
      return res
        .status(400)
        .json({ error: 'dbName must be "production" or "development".' });
    }

    await restoreDatabase({
      backupPath,
      mongoUri,
      dbName,
      collections,
    });

    return res.json({ message: "Restore triggered successfully." });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return res.status(500).json({ error: "Restore failed." });
  }
});

export default router;
