import { Config } from "./types.js";

export const mcpConfig: Config = {
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    logLevel: process.env.LOG_LEVEL || "info",
  },
  clickUp: {
    clientId: process.env.CLICKUP_CLIENT_ID || "",
    clientSecret: process.env.CLICKUP_CLIENT_SECRET || "",
    redirectUri:
      process.env.CLICKUP_REDIRECT_URI ||
      "http://localhost:3000/oauth/callback",
    apiUrl: "https://api.clickup.com/api/v2",
    authUrl: "https://app.clickup.com/api",
  },
};
