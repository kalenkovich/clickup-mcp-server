#!/usr/bin/env node

const { startClickUpServer } = require('../dist/server');
const path = require('path');
const fs = require('fs');

// Ensure we're using the correct environment
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env')
});

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development';

// Default port
const DEFAULT_PORT = 3000;

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const portArg = args.find(arg => arg.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : DEFAULT_PORT;

    // Validate port
    if (isNaN(port) || port < 0 || port > 65535) {
      console.error('Invalid port number. Please use a number between 0 and 65535.');
      process.exit(1);
    }

    // Check for required environment variables
    const requiredEnvVars = ['CLICKUP_CLIENT_ID', 'CLICKUP_CLIENT_SECRET', 'ENCRYPTION_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('\n❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('\nPlease set these variables in your .env file or environment.\n');
      process.exit(1);
    }

    // Start the server
    console.log('\n🚀 Starting ClickUp MCP Server...\n');
    
    const { app, port: actualPort } = await startClickUpServer(port);

    // Print helpful information
    if (isDev) {
      console.log('\n📝 Development Tips:');
      console.log('   - Edit .env file to configure environment variables');
      console.log('   - Use npm run dev for development with hot reload');
      console.log('   - Run tests with npm test');
      console.log('   - Format code with npm run format\n');
    }

  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();
