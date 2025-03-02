import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logInfo, logError } from "./logger";

// Extend Express Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * Middleware to add a unique request ID to each request and log request details
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate a unique request ID if not already present
  req.requestId = (req.headers["x-request-id"] as string) || uuidv4();

  // Add request ID to response headers
  res.setHeader("x-request-id", req.requestId);

  // Record start time for request duration calculation
  req.startTime = Date.now();

  // Determine the source (route) of the request
  const source = `${req.method} ${req.originalUrl}`;

  // Log the incoming request
  logInfo({
    message: `Request received: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
    source,
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    const logMessage = `Response sent: ${statusCode} (${duration}ms)`;

    if (statusCode >= 400) {
      logError({
        message: logMessage,
        requestId: req.requestId,
        source,
      });
    } else {
      logInfo({
        message: logMessage,
        requestId: req.requestId,
        source,
      });
    }
  });

  next();
}

/**
 * Error handling middleware that logs errors
 */
export function errorLoggerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const source = `${req.method} ${req.originalUrl}`;

  logError({
    message: `Error: ${err.message}\nStack: ${err.stack}`,
    requestId: req.requestId,
    source,
  });

  // Pass the error to the next error handler
  next(err);
}
