# ClickUp MCP Server

A Model Context Protocol (MCP) server for ClickUp integration, allowing AI assistants like Claude to communicate with ClickUp.

## Features

This MCP server provides the following tools for interacting with ClickUp:

- **Tasks**: Retrieve, create, and update tasks
- **Lists**: Retrieve lists and their statuses
- **Attachments**: Upload and download task attachments
- **Comments**: Retrieve task comments

## Requirements

- Node.js 18 or higher
- A ClickUp account with an API token
- Docker and Docker Compose (for containerization)

## Getting a ClickUp API Token

To use this MCP server, you need a ClickUp API token. Follow these steps to obtain one:

1. Log in to your ClickUp account
2. Click on your avatar in the top-right corner
3. Select "Settings"
4. Click on "Apps" in the sidebar
5. Under "API Token", click "Generate" or "Regenerate"
6. Copy the token and store it securely

## Finding Workspace and List IDs

To find the necessary IDs for using the tools, you can use the following methods:

1. **Workspace ID via URL**: Open ClickUp in your browser and look at the URL. It will look something like: `https://app.clickup.com/WORKSPACE_ID/v/l/li/LIST_ID`. The number after `app.clickup.com/` is your Workspace ID.

2. **Via the API**: Use the tools provided by this MCP server to retrieve the necessary IDs:
   - `get-workspaces`: Retrieves all workspaces
   - `get-spaces`: Retrieves all spaces in a workspace
   - `get-lists`: Retrieves all lists in a folder
   - `get-folderless-lists`: Retrieves all lists that are not in any folder

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd clickup-mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your ClickUp API token (only needed if you're running the server locally):
   ```
   echo "CLICKUP_API_TOKEN=your_api_token_here" > .env
   ```

   Note: If you're using Claude Desktop or Augment, you don't need this file as you'll provide the API token directly in the MCP configuration.

## Usage

### Option 1: Integration with AI Assistants (recommended)

The easiest way to use the server is to integrate it directly with your AI assistant (Claude Desktop or Augment). See the [Integration with AI Assistants](#integration-with-ai-assistants) section below for detailed instructions.

With this approach, you don't need to manually run the Docker container or set environment variables - the AI assistant will handle this for you.

### Option 2: Standalone Docker

If you want to run the server as a standalone Docker container (not through an AI assistant), you can use the following commands:

```bash
# Pull the image
docker pull ghcr.io/bravoure/clickup-mcp:latest

# Start the container with your ClickUp API token
docker run -d \
  -e CLICKUP_API_TOKEN=your_api_token_here \
  --name clickup-mcp \
  ghcr.io/bravoure/clickup-mcp:latest
```

Note: This approach is only needed if you're using the server directly, not through Claude Desktop or Augment.

### Option 3: Run locally

If you want to run the server locally, follow these steps:

```bash
# Clone the repository
git clone https://github.com/bravoure/clickup-mcp.git
cd clickup-mcp

# Install dependencies
npm install

# Create a .env file with your ClickUp API token (only needed for local development)
echo "CLICKUP_API_TOKEN=your_api_token_here" > .env

# Start the server
npm start
```

### Option 4: Docker Compose

You can also use Docker Compose to start the container:

```bash
# Clone the repository
git clone https://github.com/bravoure/clickup-mcp.git
cd clickup-mcp

# Create a .env file with your ClickUp API token (needed for Docker Compose)
echo "CLICKUP_API_TOKEN=your_api_token_here" > .env

# Start the container
docker-compose up -d
```

## Integration with AI Assistants

### Integration with Claude Desktop

To use this MCP server with Claude Desktop:

1. Make sure you have Claude Desktop installed
2. Open the configuration file at `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Add the following configuration:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-e",
        "CLICKUP_API_TOKEN=your_api_token_here",
        "ghcr.io/bravoure/clickup-mcp:latest"
      ]
    }
  }
}
```

4. Restart Claude Desktop

### Integration with Augment

To use this MCP server with Augment in VS Code:

1. Open VS Code
2. Press Cmd/Ctrl+Shift+P
3. Type "Augment: Edit Settings"
4. Click on "Edit in settings.json"
5. Add the following configuration:

```json
"augment.advanced": {
    "mcpServers": [
        {
            "name": "clickup",
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-e", "CLICKUP_API_TOKEN=your_api_token_here",
                "ghcr.io/bravoure/clickup-mcp:latest"
            ]
        }
    ]
}
```

6. Save the changes and restart VS Code

## Available Tools

| Tool | Description |
|------|-------------|
| get-task | Retrieve a specific task by ID (including comments and attachments) |
| create-task | Create a new task in a list |
| update-task | Update an existing task (including changing status) |
| get-lists | Retrieve all lists in a folder |
| get-folderless-lists | Retrieve all lists that are not in any folder |
| get-list-statuses | Retrieve all statuses for a list |
| create-task-attachment | Upload an attachment to a task |
| download-task-attachments | Download all attachments from a task |
| get-task-comments | Retrieve all comments from a task |

## License

MIT
