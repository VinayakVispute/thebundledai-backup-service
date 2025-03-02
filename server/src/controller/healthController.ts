import { Request, Response } from "express";
import { logInfo } from "../utils/logger";

interface IHealthInfo {
  status: string;
  timestamp: string;
  uptime: number;
  service: string;
  environment: string;
}

export const healthCheck = (req: Request, res: Response) => {
  // Basic health information
  const healthInfo: IHealthInfo = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "thebundledai-backup-service",
    environment: process.env.NODE_ENV || "development",
  };

  logInfo({
    message: `Health check performed: ${healthInfo.status}`,
    requestId: req.requestId,
    source: "healthController",
  });

  // Return health status with 200 OK
  res.status(200).json(healthInfo);
};
