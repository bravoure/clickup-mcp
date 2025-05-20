#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { ClickUpClient } from "./clickup-client.js";

// Load environment variables
dotenv.config();

// Initialize ClickUp client
if (!process.env.CLICKUP_API_TOKEN) {
  console.error("Error: CLICKUP_API_TOKEN environment variable is required");
  process.exit(1);
}

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
            task_id: { type: "string", description: "The ID of the task" },
            download_attachments: { type: "boolean", description: "Whether to download attachments (default: true)" },
            output_dir: { type: "string", description: "The directory to save attachments to (default: '/app/downloads')" },
            include_subtasks: { type: "boolean", description: "Whether to include subtasks in the response (default: true)" }
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
            output_dir: { type: "string", description: "The directory to save the attachments to (default: '/app/downloads')" }
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
      },
      {
        name: "create-task-comment",
        description: "Create a comment on a task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "The ID of the task" },
            comment_text: { type: "string", description: "The text content of the comment" }
          },
          required: ["task_id", "comment_text"]
        }
      },
      {
        name: "get-lists",
        description: "Get all lists in a folder",
        inputSchema: {
          type: "object",
          properties: {
            folder_id: { type: "string", description: "The ID of the folder" }
          },
          required: ["folder_id"]
        }
      },
      {
        name: "get-folderless-lists",
        description: "Get all lists that are not in any folder",
        inputSchema: {
          type: "object",
          properties: {
            space_id: { type: "string", description: "The ID of the space" }
          },
          required: ["space_id"]
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
      },
      {
        name: "update-task",
        description: "Update an existing task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "string", description: "The ID of the task" },
            name: { type: "string", description: "The name of the task" },
            description: { type: "string", description: "The description of the task" },
            status: { type: "string", description: "The status of the task" },
            priority: { type: "number", description: "The priority of the task (1-4)" },
            due_date: { type: "number", description: "The due date timestamp in milliseconds" },
            assignees: { type: "array", items: { type: "string" }, description: "Array of assignee user IDs" },
            tags: { type: "array", items: { type: "string" }, description: "Array of tag names" }
          },
          required: ["task_id"]
        }
      },
      {
        name: "get-list-statuses",
        description: "Get all statuses for a list",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "The ID of the list" }
          },
          required: ["list_id"]
        }
      },
      {
        name: "create-subtask",
        description: "Create a subtask under a parent task",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "The ID of the list containing the parent task" },
            parent_task_id: { type: "string", description: "The ID of the parent task" },
            name: { type: "string", description: "The name of the subtask" },
            description: { type: "string", description: "The description of the subtask" },
            status: { type: "string", description: "The status of the subtask" },
            priority: { type: "number", description: "The priority of the subtask (1-4)" },
            due_date: { type: "number", description: "The due date timestamp in milliseconds" },
            assignees: { type: "array", items: { type: "string" }, description: "Array of assignee user IDs" },
            tags: { type: "array", items: { type: "string" }, description: "Array of tag names" }
          },
          required: ["list_id", "parent_task_id", "name"]
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

        // Determine whether to download attachments and include subtasks
        const downloadAttachments = args.download_attachments !== false; // Default to true if not specified
        const includeSubtasks = args.include_subtasks !== false; // Default to true if not specified
        const outputDir = args.output_dir || '/app/downloads';

        // Get task with comments and attachments
        const result = await clickupClient.getTaskWithDetails(args.task_id, downloadAttachments, outputDir, includeSubtasks);
        console.log(`Task details retrieved successfully`);

        // Create a summary of the task
        const task = result.task;
        let summary = `# ${task.name}\n\n`;
        summary += `**Status:** ${task.status ? task.status.status : 'Unknown'}\n`;
        summary += `**Created:** ${new Date(parseInt(task.date_created)).toLocaleString()}\n`;
        summary += `**Last Updated:** ${new Date(parseInt(task.date_updated)).toLocaleString()}\n\n`;

        // Add hierarchy information
        summary += `## Hierarchy Information\n\n`;
        summary += `**List ID:** ${task.hierarchy.list_id || 'Not available'}\n`;
        summary += `**Workspace ID:** ${task.hierarchy.workspace_id || 'Not available'}\n`;
        summary += `**Folder ID:** ${task.hierarchy.folder_id || 'Not available'}\n`;

        // Always add parent-child relationship information, even if null or empty
        summary += `**Parent Task ID:** ${task.hierarchy.parent_task_id || 'None (this is a top-level task)'}\n`;

        // Always show subtask IDs (empty array if no subtasks)
        if (task.subtask_ids && task.subtask_ids.length > 0) {
          summary += `**Subtask IDs:** ${task.subtask_ids.join(', ')}\n`;
        } else {
          summary += `**Subtask IDs:** None (this task has no subtasks)\n`;
        }

        summary += `\n`;

        // Add description
        summary += `## Description\n\n${task.description || 'No description'}\n\n`;

        // Add subtasks if available
        if (task.subtasks && task.subtasks.length > 0) {
          summary += `## Subtasks\n\n`;
          task.subtasks.forEach(subtask => {
            summary += `- **${subtask.name}** (ID: ${subtask.id})\n`;
            summary += `  Status: ${subtask.status ? subtask.status.status : 'Unknown'}\n`;
            if (subtask.description) {
              summary += `  Description: ${subtask.description.substring(0, 100)}${subtask.description.length > 100 ? '...' : ''}\n`;
            }
          });
          summary += `\n`;
        }

        // Add comments
        summary += `## Comments\n\n${result.formattedComments}\n\n`;

        // Add attachments
        if (downloadAttachments && result.downloadedAttachments && result.downloadedAttachments.length > 0) {
          summary += `## Attachments\n\n`;
          summary += result.downloadedAttachments.map(attachment => {
            if (attachment.success) {
              return `- [${attachment.fileName}](${attachment.filePath})`;
            } else {
              return `- ${attachment.fileName} (Error: ${attachment.error})`;
            }
          }).join('\n');
          summary += `\n\nAttachments are saved in: ${outputDir}/task_${args.task_id}\n`;
        } else if (task.attachments && task.attachments.length > 0) {
          summary += `## Attachments\n\n`;
          summary += task.attachments.map(attachment => {
            return `- ${attachment.title} (${attachment.url})`;
          }).join('\n');
          summary += `\n\nAttachments were not downloaded.\n`;
        }

        // Add hierarchy information to the top level of the toolResult for easier access
        return {
          toolResult: {
            ...result,
            list_id: task.hierarchy.list_id,
            workspace_id: task.hierarchy.workspace_id,
            folder_id: task.hierarchy.folder_id,
            parent_task_id: task.hierarchy.parent_task_id || null,  // Explicitly include, even if null
            subtask_ids: task.subtask_ids || [],                   // Explicitly include, even if empty
            is_subtask: task.hierarchy.parent_task_id ? true : false,  // Helper flag to easily identify subtasks
            has_subtasks: (task.subtask_ids && task.subtask_ids.length > 0) ? true : false  // Helper flag to easily identify parent tasks
          },
          content: [
            {
              type: "text",
              text: summary
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
        const outputDir = args.output_dir || '/app/downloads';
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
    } else if (name === "create-task-comment") {
      try {
        console.log(`Creating comment for task ${args.task_id}`);
        console.log(`Comment text: ${args.comment_text}`);

        const result = await clickupClient.createTaskComment(args.task_id, args.comment_text);
        console.log(`Comment created successfully`);

        return {
          toolResult: result,
          content: [
            {
              type: "text",
              text: `Successfully added comment to task ${args.task_id}:\n\n"${args.comment_text}"`
            }
          ]
        };
      } catch (error) {
        console.error(`Error creating task comment: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error creating task comment: ${error.message}. Please check if the task ID is correct.`
            }
          ]
        };
      }
    } else if (name === "get-lists") {
      try {
        console.log(`Getting lists for folder ${args.folder_id}`);
        const lists = await clickupClient.getLists(args.folder_id);
        console.log(`Found ${lists.length} lists`);

        // Format the lists for better readability
        let formattedLists = '';
        if (lists.length === 0) {
          formattedLists = 'No lists found for this folder.';
        } else {
          formattedLists = lists.map(list => {
            return `- **${list.name}** (ID: ${list.id})`;
          }).join('\n');
        }

        return {
          toolResult: lists,
          content: [
            {
              type: "text",
              text: `Lists in folder ${args.folder_id}:\n\n${formattedLists}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error getting lists: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error getting lists: ${error.message}. Please check if the folder ID is correct.`
            }
          ]
        };
      }
    } else if (name === "get-folderless-lists") {
      try {
        console.log(`Getting folderless lists for space ${args.space_id}`);
        const lists = await clickupClient.getFolderlessLists(args.space_id);
        console.log(`Found ${lists.length} folderless lists`);

        // Format the lists for better readability
        let formattedLists = '';
        if (lists.length === 0) {
          formattedLists = 'No folderless lists found for this space.';
        } else {
          formattedLists = lists.map(list => {
            return `- **${list.name}** (ID: ${list.id})`;
          }).join('\n');
        }

        return {
          toolResult: lists,
          content: [
            {
              type: "text",
              text: `Folderless lists in space ${args.space_id}:\n\n${formattedLists}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error getting folderless lists: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error getting folderless lists: ${error.message}. Please check if the space ID is correct.`
            }
          ]
        };
      }
    } else if (name === "create-task") {
      try {
        console.log(`Creating task in list ${args.list_id}`);

        // Prepare the task data
        const taskData = {
          name: args.name,
          description: args.description || '',
        };

        // Add optional fields if provided
        if (args.status) taskData.status = args.status;
        if (args.priority) taskData.priority = args.priority;
        if (args.due_date) taskData.due_date = args.due_date;
        if (args.assignees) taskData.assignees = args.assignees;
        if (args.tags) taskData.tags = args.tags;

        const task = await clickupClient.createTask(args.list_id, taskData);
        console.log(`Created task with ID: ${task.id}`);

        return {
          toolResult: task,
          content: [
            {
              type: "text",
              text: `Successfully created task "${task.name}" in list ${args.list_id}.\n\nTask ID: ${task.id}\nTask URL: ${task.url}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error creating task: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error creating task: ${error.message}. Please check if the list ID and other parameters are correct.`
            }
          ]
        };
      }
    } else if (name === "update-task") {
      try {
        console.log(`Updating task ${args.task_id}`);

        // Prepare the task data
        const taskData = {};

        // Add fields if provided
        if (args.name) taskData.name = args.name;
        if (args.description) taskData.description = args.description;
        if (args.status) taskData.status = args.status;
        if (args.priority) taskData.priority = args.priority;
        if (args.due_date) taskData.due_date = args.due_date;
        if (args.assignees) taskData.assignees = args.assignees;
        if (args.tags) taskData.tags = args.tags;

        // Check if any fields were provided
        if (Object.keys(taskData).length === 0) {
          return {
            toolResult: { error: "No update fields provided" },
            content: [
              {
                type: "text",
                text: "Error updating task: No update fields provided. Please provide at least one field to update."
              }
            ]
          };
        }

        const task = await clickupClient.updateTask(args.task_id, taskData);
        console.log(`Updated task with ID: ${task.id}`);

        return {
          toolResult: task,
          content: [
            {
              type: "text",
              text: `Successfully updated task "${task.name}".\n\nTask ID: ${task.id}\nTask URL: ${task.url}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error updating task: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error updating task: ${error.message}. Please check if the task ID and other parameters are correct.`
            }
          ]
        };
      }
    } else if (name === "get-list-statuses") {
      try {
        console.log(`Getting statuses for list ${args.list_id}`);
        const statuses = await clickupClient.getListStatuses(args.list_id);
        console.log(`Found ${statuses.length} statuses`);

        // Format the statuses for better readability
        let formattedStatuses = '';
        if (statuses.length === 0) {
          formattedStatuses = 'No statuses found for this list.';
        } else {
          formattedStatuses = statuses.map(status => {
            return `- **${status.status}** (ID: ${status.id}, Color: ${status.color})`;
          }).join('\n');
        }

        return {
          toolResult: statuses,
          content: [
            {
              type: "text",
              text: `Statuses for list ${args.list_id}:\n\n${formattedStatuses}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error getting list statuses: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error getting list statuses: ${error.message}. Please check if the list ID is correct.`
            }
          ]
        };
      }
    } else if (name === "create-subtask") {
      try {
        console.log(`Creating subtask under parent task ${args.parent_task_id} in list ${args.list_id}`);

        // Prepare the subtask data
        const subtaskData = {
          name: args.name,
          description: args.description || '',
        };

        // Add optional fields if provided
        if (args.status) subtaskData.status = args.status;
        if (args.priority) subtaskData.priority = args.priority;
        if (args.due_date) subtaskData.due_date = args.due_date;
        if (args.assignees) subtaskData.assignees = args.assignees;
        if (args.tags) subtaskData.tags = args.tags;

        const subtask = await clickupClient.createSubtask(args.list_id, args.parent_task_id, subtaskData);
        console.log(`Created subtask with ID: ${subtask.id}`);

        return {
          toolResult: subtask,
          content: [
            {
              type: "text",
              text: `Successfully created subtask "${subtask.name}" under parent task ${args.parent_task_id}.\n\nSubtask ID: ${subtask.id}\nSubtask URL: ${subtask.url}`
            }
          ]
        };
      } catch (error) {
        console.error(`Error creating subtask: ${error.message}`);
        return {
          toolResult: { error: error.message },
          content: [
            {
              type: "text",
              text: `Error creating subtask: ${error.message}. Please check if the list ID and parent task ID are correct and in the same list.`
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


