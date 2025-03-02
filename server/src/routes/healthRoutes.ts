import express, { Request, Response } from "express";
import { healthCheck } from "../controller/healthController";
const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint to verify service status
 * @access  Public
 */

router.get("/", healthCheck);

export default router;
