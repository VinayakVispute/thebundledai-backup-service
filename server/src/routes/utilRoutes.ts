// apps/backup-service/src/routes.ts
import { Router, Response, Request } from "express";
import path from "path";
import { manualBackup, restoreBackup } from "../controller/utilControllers";

const router = Router();

router.post("/manual-backup", manualBackup);

router.post("/restore", restoreBackup);

export default router;
