# System Patterns: @nazruden/clickup-server

## 1. System Architecture Overview

The system is a Node.js server application built with TypeScript, designed to run via stdio using `@modelcontextprotocol/sdk`. It implements the Model Context Protocol (MCP) to act as a bridge between MCP clients (like AI assistants) and the ClickUp API (v2). It authenticates to ClickUp using a **Personal API Token** configured via environment variables.

## 2. Key Technical Decisions

- **Language/Runtime:** Node.js with TypeScript.
- **Protocol:** Model Context Protocol (MCP) via `@modelcontextprotocol/sdk` over Stdio.
- **Authentication:** ClickUp **Personal API Token** (configured via `process.env.CLICKUP_PERSONAL_TOKEN`).
- **API Interaction:** Uses `axios` for HTTP requests to the ClickUp API v2.
- **Code Structure:** Refactored into resource-specific modules (services, tools, tests) for better maintainability.
- **Containerization:** Docker is available (`Dockerfile`, `docker-compose.yml`).
- **Testing Framework:** Jest for unit testing service and tool layers. MCP Inspector for local end-to-end Stdio testing.
- **Linting/Formatting:** ESLint and Prettier.
- **Configuration:** Uses `.env` files (`dotenv`), effective config loaded by `src/config/app.config.ts`. Key env var: `CLICKUP_PERSONAL_TOKEN`.

## 3. Design Patterns in Use

- **Service Layer:** (`src/services/resources/*.service.ts`) Resource-specific services encapsulate business logic related to ClickUp API interactions for individual entities (Tasks, Spaces, Folders, etc.).
- **Facade Pattern:**
  - `ClickUpService` (`src/services/clickup.service.ts`) acts as a facade over the resource-specific services, providing a single point of access to them.
  - The overall server (`src/index.ts`) acts as a facade over the ClickUp API via MCP tools.
- **Modular Design:** Code is organized into modules based on ClickUp resources (e.g., `task.service.ts`, `task.tools.ts`, `task.service.test.ts`).
- **Singleton Pattern:** Used for `logger` and within `ClickUpService` for managing the `axios` API client instance which is passed to resource services.
- **LLM-Compatible Tool Schema Design:** Tool input schemas (`*.tools.ts` files) are designed for robustness with LLMs (specifically tested against Gemini 2.5 Pro experimental):
  - **Explicit Types:** Use standard JSON schema types (`string`, `number`, `boolean`, `array`, `object`). Avoid ambiguous types like `any`.
  - **Detailed Descriptions:** Provide clear, detailed descriptions for all fields, including expected formats and examples.
  - **Numeric Enum Avoidance:** For numeric fields with constraints, avoid `enum`. Instead, use `type: "number"` and explicitly list valid numbers and their meanings in the `description`.
  - **Variable Type Handling:** For fields that can accept multiple underlying data types (e.g., custom field values), use `type: "string"` in the schema. The `description` must provide explicit instructions on how the LLM should format different data types (numbers, booleans, arrays, dates) into a string. The tool handler is then responsible for parsing this string back into the correct type needed by the service layer.
  - **Strict Objects:** Use `additionalProperties: false` for objects where all properties are known (like `value_options` in `setTaskCustomFieldValueTool`), rather than allowing arbitrary additional properties.

## 4. Component Relationships

- **MCP Client (e.g., AI Assistant):** Initiates requests via stdio by invoking MCP tools.
- **`src/index.ts` (MCP Server):**
  - Uses `@modelcontextprotocol/sdk` `Server` and `StdioServerTransport`.
  - Imports tool definitions and handlers from `src/tools/*.tools.ts`.
  - Handles `CallToolRequest` and `ListToolsRequest` over stdio.
  - Instantiates a single `ClickUpService`.
  - Calls the appropriate handler function from `src/tools/*.tools.ts`, passing the `clickUpService` instance.
- **Tool Handlers (`src/tools/*.tools.ts`):**
  - Receive the `clickUpService` instance and request arguments.
  - Perform input validation.
  - Access the relevant resource service via the `clickUpService` facade (e.g., `clickUpService.taskService.createTask(...)`).
  - Format the response from the service layer into the MCP structure.
- **`ClickUpService` (`src/services/clickup.service.ts`):**
  - Initializes an `axios` client for ClickUp API v2 with an interceptor to add the `Authorization: <personal_token>` header.
  - Instantiates resource-specific services (e.g., `TaskService`, `SpaceService`) from `src/services/resources/`, passing the configured `axios` client.
  - Provides public getters (e.g., `taskService`, `spaceService`) for accessing these resource service instances.
- **Resource Services (`src/services/resources/*.service.ts`):**
  - Receive the configured `axios` client via constructor.
  - Implement methods corresponding to specific ClickUp API operations for a resource (e.g., `createTask`, `getSpaces`).
  - Handle direct `axios` calls and API-specific error logging.
- **ClickUp API:** External service (v2 targeted).
- **Configuration/Types/Utilities:** (`src/config/`, `src/types.ts`, `src/logger.ts`, `src/security.ts`, etc.) provide supporting functionality.

## 5. Data Flow (Stdio Mode)

1.  **Incoming Request:** MCP client sends `CallToolRequest` over stdio.
2.  **Request Handling (`index.ts`):** MCP Server receives request, identifies tool name, finds the corresponding handler function from `src/tools/`.
3.  **Handler Invocation (`src/tools/*.tools.ts`):** The handler function is called with the `clickUpService` instance and request arguments.
4.  **Service Access:** Handler accesses the required resource service via the `clickUpService` facade (e.g., `clickUpService.viewService`).
5.  **Resource Service Logic (`src/services/resources/*.service.ts`):**
    - The called method (e.g., `getViewDetails`) performs validation/transformation.
    - `axios` request interceptor adds `Authorization` header.
    - Makes authenticated request to the ClickUp API v2 endpoint using `axios`.
6.  **ClickUp API Response:** ClickUp API returns a response.
7.  **Resource Service Response:** Method processes the response and returns it to the handler.
8.  **Handler Response Formatting:** Handler formats the result into the MCP response structure.
9.  **MCP Response (`index.ts`):** Handler returns the formatted response, which `index.ts` sends back over stdio.

## 6. Error Handling Strategy

- **Tool Handlers (`src/tools/*.tools.ts`):** Perform initial input validation and throw errors for missing/invalid arguments.
- **Resource Services (`src/services/resources/*.service.ts`):** Catch `axios` errors, log detailed information, and throw standardized errors (e.g., `Failed to retrieve view...`).
- **`src/index.ts`:** Main try/catch block around handler invocation formats any caught error into an MCP error response.
- `logger` (from `src/logger.ts`) is used throughout for logging errors and debug information.

## 7. Scalability and Performance Considerations

- **Statelessness:** Server remains stateless regarding authentication per request.
- **Rate Limiting:** `axios` interceptor logs ClickUp rate limit headers.
- **Asynchronous Operations:** Utilizes Node.js async/await for I/O.
- **Modular Design:** Refactoring improves maintainability, potentially aiding performance tuning if needed later.

## Confidence Score: 95%

**Reasoning:** The refactored architecture using resource-specific services and tools is fully implemented and reflected. Component relationships and data flow are updated and clear. Personal API Token strategy remains validated.
