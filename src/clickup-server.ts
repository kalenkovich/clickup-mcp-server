import express from "express";
import { encrypt, decrypt } from "./security.js";
import { ClickUpTask, ClickUpList, ClickUpBoard } from "./types.js";
import { createClickUpRoutes } from "./routes/clickup.routes.js";
import { ClickUpService } from "./services/clickup.service.js";
import { config } from "./config/app.config.js";
import { logger } from "./logger.js";

const app = express();
app.use(express.json());

// Create ClickUp service instance
const clickUpService = new ClickUpService();

// Mount ClickUp routes
app.use("/api/clickup", createClickUpRoutes(clickUpService));

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
    res.json(status);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the server
const port = config.server.port;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
