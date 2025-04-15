#!/usr/bin/env node

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
        name: "get-task",
        description: "Get a specific task by ID",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "The ID of the task" }
          },
          required: ["task_id"]
        }
      },
      {
        name: "create-task-attachment",
        description: "Upload an attachment to a task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "The ID of the task" },
            file_path: { type: "string", description: "The path to the file to upload" }
          },
          required: ["task_id", "file_path"]
        }
      },
      {
        name: "download-task-attachments",
        description: "Download all attachments from a task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "The ID of the task" },
            output_dir: { type: "string", description: "The directory to save the attachments to (optional)" }
          },
          required: ["task_id"]
        }
      },
      {
        name: "get-task-comments",
        description: "Get all comments from a task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "The ID of the task" }
          },
          required: ["task_id"]
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name === "get-task") {
      try {
        console.log(`Fetching task with ID: ${args.task_id}`);
        const taskDetails = await clickupClient.getTask(args.task_id);
        console.log(`Task details: ${JSON.stringify(taskDetails)}`);
        return {
          toolResult: taskDetails,
          content: [
            {
              type: "text",
              text: JSON.stringify(taskDetails, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`Error fetching task: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error fetching task: ${error.message}. Please check if the task ID is correct.`
            }
          ]
        };
      }
    } else if (name === "create-task-attachment") {
      try {
        console.log(`Uploading attachment to task ${args.task_id} from file ${args.file_path}`);
        const result = await clickupClient.createTaskAttachment(args.task_id, args.file_path);
        console.log(`Upload result: ${JSON.stringify(result)}`);
        return {
          toolResult: result,
          content: [
            {
              type: "text",
              text: `Successfully uploaded attachment to task ${args.task_id}. ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error uploading attachment: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error uploading attachment: ${error.message}. Please check if the task ID and file path are correct.`
            }
          ]
        };
      }
    } else if (name === "download-task-attachments") {
      try {
        console.log(`Downloading attachments from task ${args.task_id}`);
        const outputDir = args.output_dir || './downloads';
        const result = await clickupClient.downloadAllTaskAttachments(args.task_id, outputDir);
        console.log(`Download result: ${JSON.stringify(result)}`);

        // Create a more detailed response with file paths
        const fileList = result.downloadedFiles.map(file => `- ${file.fileName} (${file.filePath})`);

        return {
          toolResult: result,
          content: [
            {
              type: "text",
              text: `Successfully downloaded ${result.downloadedFiles.length} attachments from task ${args.task_id}:\n\n${fileList.join('\n')}\n\nFiles are saved in: ${outputDir}/task_${args.task_id}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error downloading attachments: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error downloading attachments: ${error.message}. Please check if the task ID is correct.`
            }
          ]
        };
      }
    } else if (name === "get-task-comments") {
      try {
        console.log(`Getting comments for task ${args.task_id}`);
        const comments = await clickupClient.getTaskComments(args.task_id);
        console.log(`Found ${comments.length} comments`);

        // Format the comments for better readability
        let formattedComments = '';
        if (comments.length === 0) {
          formattedComments = 'No comments found for this task.';
        } else {
          formattedComments = comments.map(comment => {
            return `**${comment.user ? comment.user.username : 'Unknown user'}** (${new Date(comment.date).toLocaleString()}):\n${comment.text}\n`;
          }).join('\n---\n\n');
        }

        return {
          toolResult: comments,
          content: [
            {
              type: "text",
              text: `Comments for task ${args.task_id}:\n\n${formattedComments}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error getting task comments: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error getting task comments: ${error.message}. Please check if the task ID is correct.`
            }
          ]
        };
      }
    } else {
      throw new McpError(ErrorCode.ToolNotFound, `Tool '${name}' not found`);
    }
  } catch (error) {
    console.error(`Error in MCP server: ${error.message}`);
    if (error instanceof McpError) {
      error.content = [{
        type: "text",
        text: error.message
      }];
      throw error;
    }
    const mcpError = new McpError(ErrorCode.ToolExecutionError, `Error executing tool: ${error.message}`);
    mcpError.content = [{
      type: "text",
      text: `Error executing tool: ${error.message}`
    }];
    throw mcpError;
  }
});

// Start the server with stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("Error connecting to transport:", error);
  process.exit(1);
});


