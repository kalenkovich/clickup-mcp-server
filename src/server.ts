import express, {
  Express,
  Request,
  Response,
  NextFunction,
  Application,
} from "express";
import path from "path";
import { ClickUpService } from "./services/clickup.service.js";
import { OAuthService } from "./services/oauth.service.js";
import { config } from "./config/app.config.js";
import { logger } from "./logger.js";

const app = express();
export const expressApp = app;

// Middleware pour la gestion des erreurs
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message);
  res.status(500).json({ error: err.message });
};

// Middleware pour la gestion des routes non trouvées
const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: "Route not found" });
};

// Middleware pour la limitation des requêtes
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement rate limiting
  next();
};

// Middleware pour l'authentification
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const teamId = req.headers["x-team-id"];
  if (!teamId || typeof teamId !== "string") {
    return res.status(400).json({ error: "Missing or invalid teamId" });
  }

  const oauthService = new OAuthService(config.clickUp);
  if (!oauthService.isAuthenticated(teamId)) {
    return res.status(401).json({ error: "Authentication required" });
  }

  next();
};

function setupRoutes(app: Application, clickUpService: ClickUpService) {
  // Middleware pour le logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Middleware pour le parsing du corps des requêtes
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: true });
  app.use(jsonParser);
  app.use(urlencodedParser);

  // Servir les fichiers statiques
  const publicPath = path.join(process.cwd(), "public");
  const staticHandler = express.static(publicPath);
  app.use(staticHandler);

  // Route pour la page d'accueil
  app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // Route pour le health check
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Health check failed: ${error.message}`);
      }
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // Routes OAuth
  const oauthService = new OAuthService(config.clickUp);

  app.get("/oauth/clickup/authorize", async (req: Request, res: Response) => {
    try {
      const { url } = oauthService.generateAuthUrl();
      res.redirect(url);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`OAuth authorization failed: ${error.message}`);
      }
      res.status(500).json({ error: "OAuth authorization failed" });
    }
  });

  app.get("/oauth/clickup/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (
        !code ||
        !state ||
        typeof code !== "string" ||
        typeof state !== "string"
      ) {
        throw new Error("Invalid callback parameters");
      }

      await oauthService.handleCallback(code, state);
      res.redirect("/oauth/success");
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`OAuth callback failed: ${error.message}`);
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "OAuth callback failed" });
      }
    }
  });

  app.get("/oauth/success", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, "oauth-success.html"));
  });

  // Routes API protégées
  app.get(
    "/api/teams",
    rateLimiter,
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const teams = await clickUpService.getTeams();
        res.json(teams);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Failed to get teams: ${error.message}`);
        }
        res.status(500).json({ error: "Failed to get teams" });
      }
    }
  );

  app.post(
    "/api/tasks",
    rateLimiter,
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { teamId, listId, task } = req.body;

        if (!teamId || !listId || !task) {
          return res.status(400).json({ error: "Missing required parameters" });
        }

        const createdTask = await clickUpService.createTask({
          ...task,
          list_id: listId,
        });

        res.json(createdTask);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Failed to create task: ${error.message}`);
        }
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  );

  // Middleware pour la gestion des erreurs
  app.use(errorHandler);

  // Middleware pour la gestion des routes non trouvées
  app.use(notFoundHandler);
}

export function createServer(clickUpService: ClickUpService) {
  setupRoutes(app, clickUpService);
  return app;
}

export const startServer = async (port: number = config.server.port) => {
  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  return server;
};
