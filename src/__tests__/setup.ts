import dotenv from "dotenv";
import path from "path";
import type { Config } from "@jest/types";
import { jest, expect, beforeAll, afterEach } from "@jest/globals";

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, "../../.env.test"),
});

// Set up test environment variables
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.CLICKUP_CLIENT_ID = "test_client_id";
process.env.CLICKUP_CLIENT_SECRET = "test_client_secret";
process.env.CLICKUP_REDIRECT_URI = "http://localhost:3000/oauth/callback";
process.env.ENCRYPTION_KEY = "test-encryption-key-32-chars-long-key";

// Configure Jest globals
beforeAll(() => {
  // Add custom matchers
  expect.extend({
    toContainObject(received: any[], item: Record<string, unknown>) {
      const pass = received.some((element) =>
        expect.objectContaining(item).asymmetricMatch(element)
      );

      return {
        pass,
        message: () =>
          pass
            ? `expected ${JSON.stringify(received)} not to contain object ${JSON.stringify(item)}`
            : `expected ${JSON.stringify(received)} to contain object ${JSON.stringify(item)}`,
      };
    },
  });
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error logging for debugging
  error: jest.fn(),
  // Silence debug and info logs
  debug: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
});
