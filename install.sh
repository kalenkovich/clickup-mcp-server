#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is required but not installed. Please install npm first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Create symlink for global access
if [ ! -d "$HOME/.local/bin" ]; then
    mkdir -p "$HOME/.local/bin"
fi

# Create the launcher script
cat > "$HOME/.local/bin/clickup-mcp" << EOL
#!/bin/bash
node $(pwd)/dist/clickup-server.js "\$@"
EOL

# Make the launcher executable
chmod +x "$HOME/.local/bin/clickup-mcp"

echo "ClickUp MCP Server has been installed successfully!"
echo ""
echo "Next steps:"
echo "1. Go to https://clickup.com/api to create an OAuth application"
echo "2. Set the redirect URI to: http://localhost:3000/oauth/clickup/callback"
echo "3. Copy the Client ID and Client Secret to your .env file"
echo ""
echo "Your .env file is located at: $(pwd)/.env" 