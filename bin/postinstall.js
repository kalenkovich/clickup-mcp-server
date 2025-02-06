import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function postInstall() {
  try {
    // Create necessary directories
    const dirs = ["dist", "logs", "public"];

    for (const dir of dirs) {
      const dirPath = path.join(__dirname, "..", dir);
      await fs.mkdir(dirPath, { recursive: true });
    }

    // Create default config if it doesn't exist
    const configPath = path.join(__dirname, "..", ".env");
    const configExists = await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false);

    if (!configExists) {
      const defaultConfig = `# ClickUp MCP Server Configuration
# Required
CLICKUP_CLIENT_ID=
CLICKUP_CLIENT_SECRET=
CLICKUP_REDIRECT_URI=http://localhost:3000/oauth/callback

# Optional
PORT=3000
LOG_LEVEL=info
`;

      await fs.writeFile(configPath, defaultConfig, "utf8");
    }

    // Create public directory with success page
    const publicPath = path.join(__dirname, "..", "public");
    const successHtmlPath = path.join(publicPath, "oauth-success.html");
    const successHtmlExists = await fs
      .access(successHtmlPath)
      .then(() => true)
      .catch(() => false);

    if (!successHtmlExists) {
      const successHtml = `<!DOCTYPE html>
<html>
<head>
    <title>OAuth Success</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2ecc71;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        .close-button {
            background-color: #2ecc71;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }
        .close-button:hover {
            background-color: #27ae60;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Authentication Successful!</h1>
        <p>You can now close this window and return to Claude.</p>
        <button class="close-button" onclick="window.close()">Close Window</button>
    </div>
</body>
</html>`;

      await fs.writeFile(successHtmlPath, successHtml, "utf8");
    }

    console.log("✅ Post-install setup completed successfully");
  } catch (error) {
    console.error("❌ Post-install setup failed:", error);
    process.exit(1);
  }
}

postInstall();
