import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { ClickUpClient } from "./clickup-client.js";

// Load environment variables
dotenv.config();

// Initialize ClickUp client
const clickupClient = new ClickUpClient(process.env.CLICKUP_API_TOKEN);

// Create MCP server instance
const server = new Server({
  name: "clickup",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get-workspaces",
        description: "Get all authorized workspaces",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get-spaces",
        description: "Get all spaces in a workspace",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "The ID of the workspace" }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "get-tasks",
        description: "Get tasks from a list",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "The ID of the list" },
            page: { type: "number", description: "Page number for pagination" }
          },
          required: ["list_id"]
        }
      },
      {
        name: "create-task",
        description: "Create a new task in a list",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "The ID of the list" },
            name: { type: "string", description: "The name of the task" },
            description: { type: "string", description: "The description of the task" },
            status: { type: "string", description: "The status of the task" },
            priority: { type: "number", description: "The priority of the task (1-4)" },
            due_date: { type: "number", description: "The due date timestamp in milliseconds" },
            assignees: { type: "array", items: { type: "string" }, description: "Array of assignee user IDs" },
            tags: { type: "array", items: { type: "string" }, description: "Array of tag names" }
          },
          required: ["list_id", "name"]
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get-workspaces":
        const workspaces = await clickupClient.getWorkspaces();
        return { toolResult: workspaces };

      case "get-spaces":
        const spaces = await clickupClient.getSpaces(args.workspace_id);
        return { toolResult: spaces };

      case "get-tasks":
        const tasks = await clickupClient.getTasks(args.list_id, args.page || 0);
        return { toolResult: tasks };

      case "create-task":
        const task = await clickupClient.createTask(args.list_id, {
          name: args.name,
          description: args.description,
          status: args.status,
          priority: args.priority,
          due_date: args.due_date,
          assignees: args.assignees,
          tags: args.tags
        });
        return { toolResult: task };

      default:
        throw new McpError(ErrorCode.ToolNotFound, `Tool '${name}' not found`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.ToolExecutionError, `Error executing tool: ${error.message}`);
  }
});

// Start the server with stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("Error connecting to transport:", error);
  process.exit(1);
});

      try {
        const timeEntries = await clickupClient.getTimeEntries(task_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(timeEntries, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching time entries: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Create Time Entry
  server.tool(
    "create-time-entry",
    "Create a time entry for a task",
    {
      task_id: z.string().describe("The ID of the task"),
      start: z.number().describe("Start time in milliseconds"),
      duration: z.number().describe("Duration in milliseconds"),
      description: z.string().optional().describe("Description of the time entry"),
    },
    async ({ task_id, start, duration, description }) => {
      try {
        const timeEntry = await clickupClient.createTimeEntry(task_id, {
          start,
          duration,
          description,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(timeEntry, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating time entry: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Search Tasks
  server.tool(
    "search-tasks",
    "Search for tasks across a workspace",
    {
      workspace_id: z.string().describe("The ID of the workspace"),
      query: z.string().describe("Search query"),
      page: z.number().optional().describe("Page number for pagination"),
    },
    async ({ workspace_id, query, page }) => {
      try {
        const tasks = await clickupClient.searchTasks(workspace_id, query, page || 0);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching tasks: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
