# Contributing to ClickUp MCP Server

Thank you for your interest in contributing to the ClickUp MCP Server! Here are some guidelines to help you.

## Setting Up Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/bravoure/clickup-mcp.git
   cd clickup-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your ClickUp API token:
   ```bash
   echo "CLICKUP_API_TOKEN=your_api_token_here" > .env
   ```

4. Start the server in development mode:
   ```bash
   npm run dev
   ```

## GitHub Actions Workflow

This repository uses GitHub Actions to automatically build a Docker image and push it to GitHub Container Registry (GHCR) when changes are pushed to the main branch.

### Setting Up the Workflow

To make the GitHub Actions workflow work correctly, you need to follow these steps:

1. Ensure your repository has access to GitHub Packages. Go to repository settings > Actions > General and make sure "Read and write permissions" is enabled under "Workflow permissions".

2. Ensure that GitHub Container Registry is enabled for your account or organization.

### Manual Triggering

You can manually trigger the workflow via the GitHub UI:

1. Go to the "Actions" tab in your repository
2. Select the "Build and Push Docker Image" workflow
3. Click on "Run workflow"
4. Select the branch and click on "Run workflow"

## Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Commit your changes
4. Push to your fork
5. Create a Pull Request

## Code Style

- Use ES modules (import/export)
- Use async/await for asynchronous code
- Add comments to your code
- Keep functions small and focused

## Testing

Before making a Pull Request, test your changes by:

1. Running the server locally
2. Testing the new functionality with an AI assistant like Claude or Augment
3. Ensuring all existing functionality continues to work

## Adding New Functionality

If you want to add new functionality:

1. Add the method to the `ClickUpClient` class
2. Add the tool to the MCP server
3. Add the handler for the new tool
4. Update the README.md to document the new functionality

## Questions?

If you have any questions, please open an issue in the repository.
