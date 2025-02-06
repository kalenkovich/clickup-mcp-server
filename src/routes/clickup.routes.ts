import express, { Request, Response } from "express";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

export const createClickUpRoutes = (clickUpService: ClickUpService) => {
  const router = express.Router();

  // Health check endpoint
  router.get("/health", async (req: Request, res: Response) => {
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

  // Teams endpoint
  router.get("/teams", async (req: Request, res: Response) => {
    try {
      const teams = await clickUpService.getTeams();
      res.json(teams);
    } catch (error) {
      logger.error("Failed to get teams:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to retrieve teams",
      });
    }
  });

  // Lists endpoint
  router.get("/lists/:folderId", async (req: Request, res: Response) => {
    try {
      const { folderId } = req.params;
      const lists = await clickUpService.getLists(folderId);
      res.json(lists);
    } catch (error) {
      logger.error("Failed to get lists:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to retrieve lists",
      });
    }
  });

  // Create task endpoint
  router.post("/tasks", async (req: Request, res: Response) => {
    try {
      const task = await clickUpService.createTask(req.body);
      res.json(task);
    } catch (error) {
      logger.error("Failed to create task:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create task",
      });
    }
  });

  // Update task endpoint
  router.put("/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const task = await clickUpService.updateTask(taskId, req.body);
      res.json(task);
    } catch (error) {
      logger.error("Failed to update task:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update task",
      });
    }
  });

  // Create board endpoint
  router.post("/boards", async (req: Request, res: Response) => {
    try {
      const board = await clickUpService.createBoard(req.body);
      res.json(board);
    } catch (error) {
      logger.error("Failed to create board:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to create board",
      });
    }
  });

  return router;
};
