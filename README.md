# ClickUp MCP Server

A Model Context Protocol server implementation for ClickUp integration, enabling AI assistants to interact with ClickUp workspaces using **ClickUp API v2**.

This server runs via **Stdio** as per the MCP specification when invoked by an MCP client.

## Quick Start

This server uses your **ClickUp Personal API Token** for authentication.

1.  **Generate a Personal API Token:** In your ClickUp settings, navigate to "My Settings" > "Apps" and generate a token.
2.  **Configure your MCP Client (e.g., Claude for Desktop):** Set the required environment variable when configuring the server for your client.

Example configuration snippet for an MCP client:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["@nazruden/clickup-server"],
      "env": {
        "CLICKUP_PERSONAL_TOKEN": "your_personal_api_token_here"
      }
    }
  }
}
```

3.  **Restart your MCP Client.**

The server will be automatically downloaded and started by the MCP client when needed.

## Environment Variables

### Required

- `CLICKUP_PERSONAL_TOKEN`: Your ClickUp Personal API Token. This is essential for the server to authenticate with the ClickUp API.

### Optional

- `LOG_LEVEL`: Logging level for the server. Supports `error`, `warn`, `info`, `debug`. Defaults to `info`.
- `ENCRYPTION_KEY`: A persistent 32-byte hex-encoded key. The configuration system (`src/config/app.config.ts`) loads or generates this key, and `src/security.ts` contains encryption/decryption functions. However, this mechanism is **currently not used** for encrypting the `CLICKUP_PERSONAL_TOKEN` within the `ClickUpService`'s Personal API Token authentication flow.
- `PORT`: Server port. This is **not used** by the default Stdio MCP server mode but might be relevant if an HTTP transport or additional HTTP features (like a separate health check endpoint) were explicitly added. Defaults to `3000` in the config if read.

## Available Tools

The following MCP tools are currently implemented:

### Task Management

- `clickup_create_task`: Create a new task in a ClickUp list.
  - Requires: `list_id`, `name`.
  - Optional: `description`, `status`, `priority`, `assignees`, `due_date`, `time_estimate`, `tags`.
- `clickup_update_task`: Update an existing task's properties.
  - Requires: `task_id`.
  - Optional: Any writable `ClickUpTask` properties.

### Team & List Management

- `clickup_get_teams`: Retrieve all accessible teams (Workspaces in ClickUp API v2).
- `clickup_get_lists`: Get all lists in a specific folder.
  - Requires: `folder_id`.

### Board Management

- `clickup_create_board`: Create a new board in a ClickUp space.
  - Requires: `space_id`, `name`.

## Development

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd clickup-mcp-server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory and add your `CLICKUP_PERSONAL_TOKEN`:
    ```env
    CLICKUP_PERSONAL_TOKEN=your_actual_personal_api_token_here
    LOG_LEVEL=debug
    ```
4.  Start in development mode (Stdio):
    The server will listen for MCP messages on stdin/stdout.

    ```bash
    npm run dev
    ```

    This uses `ts-node-dev` to run `src/index.ts`.

5.  Build for production:

    ```bash
    npm run build
    ```

    This compiles TypeScript to `dist/`.

6.  Run tests:
    ```bash
    npm test
    ```
    This runs Jest unit tests located in `src/__tests__`. Ensure you have a `.env.test` file (see `src/__tests__/setup.ts`).

### Testing with MCP Inspector

You can test the server locally using the MCP Inspector:

1.  Ensure your `CLICKUP_PERSONAL_TOKEN` is available. You can either:
    - Set it in your shell environment before running the inspector.
    - Set it within the MCP Inspector UI if it provides an option for server environment variables.
    - Have it in your local `.env` file (as `src/index.ts` loads `dotenv`).
2.  Run the Inspector with the server:
    ```bash
    npx @modelcontextprotocol/inspector node --loader ts-node/esm src/index.ts
    ```
    The Inspector UI should launch, allowing you to connect to the server and call its tools.

## Security

- Authenticates using your ClickUp Personal API Token. **Keep this token secure and confidential.** Treat it like a password.
- The server expects the `CLICKUP_PERSONAL_TOKEN` to be provided via an environment variable by the consuming MCP client or development environment.
- The configuration system includes logic for an `ENCRYPTION_KEY` and `src/security.ts` has encryption functions, but this is **not currently applied** to the Personal API Token by the `ClickUpService`.
- No sensitive data (like the token itself) is logged by default with `LOG_LEVEL=info`. Debug level might log more details.
- Rate limiting for ClickUp API calls is handled by logging remaining requests (see `ClickUpService`).

## Troubleshooting

### Common Issues

1.  **Authentication Errors (401 from ClickUp API)**

    - Verify your `CLICKUP_PERSONAL_TOKEN` environment variable is correctly set and accessible by the server process.
    - Ensure the token is valid and not revoked in your ClickUp settings.
    - Check server logs for messages from `ClickUpService` regarding authentication.

2.  **Rate Limiting by ClickUp API**

    - The server logs rate limit information from ClickUp API responses.
    - If rate limits are hit frequently, this indicates high usage. The server itself does not implement queuing or complex backoff beyond what `axios` might do by default.

3.  **Server Not Starting / MCP Inspector Connection Issues**
    - Ensure `CLICKUP_PERSONAL_TOKEN` is set.
    - If using `npm run dev`, check for TypeScript or `ts-node-dev` errors in the console.
    - If using MCP Inspector with `node --loader ts-node/esm src/index.ts`, ensure `ts-node` and project dependencies are correctly installed.
    - Check for console errors from `src/index.ts` or `ClickUpService`.

### Getting Server Logs

- When run via `npm run dev` or `npm start`, logs go to the console.
- If run by an MCP client (like Claude for Desktop), logs are typically managed by that client. For Claude for Desktop, logs can often be found at:
  - Windows: `%USERPROFILE%\AppData\Local\Claude\Logs\mcp\<server_name_and_id>\<process_id>.log` (path may vary slightly)
  - macOS: `~/Library/Logs/Claude/mcp/<server_name_and_id>/<process_id>.log` (path may vary slightly)

## License

MIT License - see LICENSE file for details
