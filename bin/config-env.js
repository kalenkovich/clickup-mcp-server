#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ENV_FILE = path.resolve(process.cwd(), ".env");
const REQUIRED_VARS = [
  "CLICKUP_CLIENT_ID",
  "CLICKUP_CLIENT_SECRET",
  "ENCRYPTION_KEY",
  "CLICKUP_REDIRECT_URI",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function readEnvFile() {
  try {
    const content = fs.readFileSync(ENV_FILE, "utf8");
    const envVars = {};
    content.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch (error) {
    return {};
  }
}

function writeEnvFile(envVars) {
  const content = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(ENV_FILE, content);
}

async function promptForValue(key, currentValue) {
  return new Promise((resolve) => {
    const defaultValue = currentValue ? ` (current: ${currentValue})` : "";
    rl.question(`Enter value for ${key}${defaultValue}: `, (answer) => {
      resolve(answer || currentValue);
    });
  });
}

async function setEnvVar(key) {
  const envVars = readEnvFile();
  const value = await promptForValue(key, envVars[key]);
  if (value) {
    envVars[key] = value;
    writeEnvFile(envVars);
    console.log(`✅ Set ${key}`);
  }
  return value;
}

async function getEnvVar(key) {
  const envVars = readEnvFile();
  console.log(`${key}=${envVars[key] || ""}`);
}

function listEnvVars() {
  const envVars = readEnvFile();
  console.log("\nCurrent environment variables:");
  REQUIRED_VARS.forEach((key) => {
    const value = envVars[key];
    const status = value ? "✅" : "❌";
    console.log(`${status} ${key}=${value || ""}`);
  });
}

async function main() {
  const command = process.argv[2];
  const key = process.argv[3];

  try {
    switch (command) {
      case "set":
        if (key) {
          await setEnvVar(key);
        } else {
          console.log("\n📝 Setting up environment variables...\n");
          for (const key of REQUIRED_VARS) {
            await setEnvVar(key);
          }
        }
        break;

      case "get":
        if (!key) {
          console.error("Please specify an environment variable name");
          process.exit(1);
        }
        await getEnvVar(key);
        break;

      case "list":
        listEnvVars();
        break;

      default:
        console.log(`
Usage:
  npm run config:set [variable]  - Set one or all environment variables
  npm run config:get <variable>  - Get the value of an environment variable
  npm run config:list           - List all environment variables

Examples:
  npm run config:set                    - Interactive setup of all variables
  npm run config:set CLICKUP_CLIENT_ID  - Set specific variable
  npm run config:get CLICKUP_CLIENT_ID  - Get specific variable
  npm run config:list                   - Show all variables
        `);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
