# System Patterns: @nazruden/clickup-server

## 1. System Architecture Overview

The system is a Node.js server application built with TypeScript, designed to run via stdio using `@modelcontextprotocol/sdk`. It implements the Model Context Protocol (MCP) to act as a bridge between MCP clients (like AI assistants) and the ClickUp API (v2). It authenticates to ClickUp using a **Personal API Token** configured via environment variables.

## 2. Key Technical Decisions

- **Language/Runtime:** Node.js with TypeScript.
- **Protocol:** Model Context Protocol (MCP) via `@modelcontextprotocol/sdk` over Stdio.
- **Authentication:** ClickUp **Personal API Token** (configured via `process.env.CLICKUP_PERSONAL_TOKEN`). OAuth2 code and configuration have been removed.
- **API Interaction:** Uses `axios` for HTTP requests to the ClickUp API v2.
- **Containerization:** Docker is available (`Dockerfile`, `docker-compose.yml`), allowing for containerized deployment.
- **Testing Framework:** Jest for unit testing the service layer (`ClickUpService`). MCP Inspector for local end-to-end Stdio testing.
- **Linting/Formatting:** ESLint and Prettier.
- **Configuration:** Uses `.env` files (`dotenv`), effective config loaded by `src/config/app.config.ts`. Key env var: `CLICKUP_PERSONAL_TOKEN`.

## 3. Design Patterns in Use

- **Service Layer:** (`src/services/clickup.service.ts`) Encapsulates business logic related to ClickUp API interactions and tool implementation.
- **Singleton Pattern:** Used for `logger` and within `ClickUpService` for managing the `axios` API client instance.
- **Facade Pattern:** Server acts as a facade over ClickUp API via MCP tools.

## 4. Component Relationships

- **MCP Client (e.g., AI Assistant):** Initiates requests via stdio by invoking MCP tools.
- **`src/index.ts` (MCP Server):**
  - Uses `@modelcontextprotocol/sdk` `Server` and `StdioServerTransport`.
  - Handles `CallToolRequest` and `ListToolsRequest` over stdio.
  - Instantiates a single `ClickUpService`.
  - Calls methods on `ClickUpService` based on tool requests.
- **`ClickUpService` (`src/services/clickup.service.ts`):**
  - Configured with the ClickUp Personal API Token (read from config).
  - Initializes an `axios` client for ClickUp API v2 with an interceptor to add the `Authorization: <personal_token>` header.
  - Implements methods for each MCP tool.
  - OAuth-specific logic has been removed.
- **ClickUp API:** External service (v2 targeted).
- **`src/config/app.config.ts`:** Handles `CLICKUP_PERSONAL_TOKEN` and other server configurations.
- **`src/security.ts`:** Contains encryption logic, currently unused for Personal API Token handling but loaded by config.
- **`src/types.ts`:** Central file for type definitions (OAuth types removed).
- **`bin/config-env.js` & `bin/postinstall.js`:** Utility scripts for managing server configuration and setup.

## 5. Data Flow (Stdio Mode)

1.  **Incoming Request:** MCP client sends `CallToolRequest` over stdio.
2.  **Request Handling (`index.ts`):** MCP Server receives request, identifies tool name and arguments.
3.  **Delegation to Service:** Calls the corresponding method on the single `clickUpService` instance.
4.  **Service Logic (`ClickUpService`):**
    - Performs validation/transformation.
    - `axios` request interceptor adds `Authorization: <personal_token>` header.
    - Makes authenticated request to the ClickUp API v2 endpoint using `axios`.
5.  **ClickUp API Response:** ClickUp API returns a response.
6.  **Service Response Processing:** `ClickUpService` processes the response and returns it to `index.ts`.
7.  **MCP Response:** `index.ts` handler formats the result into the MCP response structure and sends it back over stdio.

## 6. Error Handling Strategy

- The server needs to handle errors from:
  - MCP client requests (invalid parameters, etc.) - handled by MCP SDK and tool implementation.
  - ClickUp API (authentication errors, API errors, rate limits) - handled within `ClickUpService` methods, which throw specific errors.
  - Internal server errors - general try/catch in `index.ts` or service layer.
- `README.md` mentions logging and troubleshooting tips.
- `logger` (from `src/logger.ts`) is used for logging errors.

## 7. Scalability and Performance Considerations

- **Statelessness:** The server, using Personal API Token, is stateless regarding authentication per request, facilitating horizontal scaling.
- **Rate Limiting:** Implements rate limiting for ClickUp API calls (logging in `ClickUpService` interceptor).
- **Asynchronous Operations:** Node.js is inherently asynchronous, good for I/O-bound operations like API calls.
- Docker usage facilitates deployment and scaling.

## Confidence Score: 95%

**Reasoning:** The Personal API Token architecture is fully implemented, tested via unit tests for `ClickUpService` and end-to-end with the MCP Inspector. OAuth remnants have been removed, simplifying the patterns. Data flow and component interactions for the core Stdio mode are clear and validated.
