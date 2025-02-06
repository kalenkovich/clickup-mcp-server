import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

// Load environment variables from .env file
dotenv.config();

interface ServerConfig {
  port: number;
  logLevel: string;
}

interface ClickUpConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiUrl: string;
  authUrl: string;
}

interface Config {
  server: ServerConfig;
  clickUp: ClickUpConfig;
}

function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateConfig(): Config {
  const requiredEnvVars = ["CLICKUP_CLIENT_ID", "CLICKUP_CLIENT_SECRET"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const logLevel = process.env.LOG_LEVEL || "info";

  // In development, we use a dynamic redirect URI based on the port
  const redirectUri =
    process.env.CLICKUP_REDIRECT_URI ||
    `http://localhost:${port}/oauth/clickup/callback`;

  // Generate encryption key if not provided
  const encryptionKey = process.env.ENCRYPTION_KEY || generateEncryptionKey();

  return {
    server: {
      port,
      logLevel,
    },
    clickUp: {
      clientId: process.env.CLICKUP_CLIENT_ID!,
      clientSecret: process.env.CLICKUP_CLIENT_SECRET!,
      redirectUri,
      apiUrl: "https://api.clickup.com/api/v2",
      authUrl: "https://app.clickup.com/api",
    },
  };
}

export const config = validateConfig();
