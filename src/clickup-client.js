import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";

export class ClickUpClient {
  constructor(apiToken) {
    if (!apiToken) {
      throw new Error("ClickUp API token is required");
    }

    this.apiToken = apiToken;
    this.client = axios.create({
      baseURL: "https://api.clickup.com/api/v2",
      headers: {
        Authorization: apiToken,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId) {
    try {
      // Log the full URL for debugging
      const url = `/task/${taskId}`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);
      console.log(`Authorization header: ${this.client.defaults.headers.Authorization.substring(0, 10)}...`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`API error in getTask: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching task: ${error.message}. Please check if the task ID is correct.`);
    }
  }

  /**
   * Get a task with its comments and download attachments
   */
  async getTaskWithDetails(taskId, downloadAttachments = true, outputDir = './downloads') {
    try {
      // Get the task
      console.log(`Getting task with details for ${taskId}`);
      const task = await this.getTask(taskId);

      // Get the comments
      console.log(`Getting comments for task ${taskId}`);
      const comments = await this.getTaskComments(taskId);

      // Add comments to the task
      task.processed_comments = comments;

      // Format the comments for better readability
      let formattedComments = '';
      if (comments.length === 0) {
        formattedComments = 'No comments found for this task.';
      } else {
        formattedComments = comments.map(comment => {
          return `**${comment.user ? comment.user.username : 'Unknown user'}** (${new Date(comment.date).toLocaleString()}):\n${comment.text}\n`;
        }).join('\n---\n\n');
      }

      task.formatted_comments = formattedComments;

      // Download attachments if requested and if there are any
      let downloadedAttachments = [];
      if (downloadAttachments && task.attachments && task.attachments.length > 0) {
        console.log(`Downloading ${task.attachments.length} attachments for task ${taskId}`);

        // Create a task-specific directory
        const taskDir = path.join(outputDir, `task_${taskId}`);
        if (!fs.existsSync(taskDir)) {
          fs.mkdirSync(taskDir, { recursive: true });
        }

        // Download each attachment
        for (const attachment of task.attachments) {
          try {
            console.log(`Downloading attachment: ${attachment.title}`);
            const result = await this.downloadAttachment(attachment.url, taskDir);
            downloadedAttachments.push(result);
          } catch (attachmentError) {
            console.error(`Error downloading attachment ${attachment.title}: ${attachmentError.message}`);
            downloadedAttachments.push({
              success: false,
              fileName: attachment.title,
              error: attachmentError.message
            });
          }
        }

        // Add downloaded attachments to the task
        task.downloaded_attachments = downloadedAttachments;
      }

      return {
        task,
        comments,
        downloadedAttachments,
        formattedComments
      };
    } catch (error) {
      console.error(`Error getting task with details: ${error.message}`);
      throw new Error(`Error getting task with details: ${error.message}`);
    }
  }

  /**
   * Download an attachment from a task
   */
  async downloadAttachment(attachmentUrl, outputDir = './downloads') {
    try {
      // Create the output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Extract the filename from the URL
      const filename = decodeURIComponent(path.basename(attachmentUrl));
      const outputPath = path.join(outputDir, filename);

      console.log(`Downloading attachment from ${attachmentUrl}`);
      console.log(`Saving to ${outputPath}`);

      // Download the file
      const response = await axios({
        method: 'GET',
        url: attachmentUrl,
        responseType: 'stream'
      });

      // Save the file
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      // Return a promise that resolves when the file is downloaded
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`Successfully downloaded attachment to ${outputPath}`);
          resolve({
            success: true,
            filePath: outputPath,
            fileName: filename
          });
        });
        writer.on('error', (err) => {
          console.error(`Error writing file: ${err.message}`);
          reject(new Error(`Error writing file: ${err.message}`));
        });
      });
    } catch (error) {
      console.error(`Error downloading attachment: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
      }
      throw new Error(`Error downloading attachment: ${error.message}`);
    }
  }

  /**
   * Download all attachments from a task
   */
  async downloadAllTaskAttachments(taskId, outputDir = './downloads') {
    try {
      // First get the task to get the attachments
      const task = await this.getTask(taskId);

      if (!task.attachments || task.attachments.length === 0) {
        return {
          success: true,
          message: 'No attachments found for this task',
          downloadedFiles: []
        };
      }

      console.log(`Found ${task.attachments.length} attachments for task ${taskId}`);

      // Create a task-specific directory
      const taskDir = path.join(outputDir, `task_${taskId}`);
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }

      // Download each attachment
      const downloadPromises = task.attachments.map(attachment => {
        return this.downloadAttachment(attachment.url, taskDir);
      });

      const results = await Promise.all(downloadPromises);

      return {
        success: true,
        message: `Successfully downloaded ${results.length} attachments`,
        downloadedFiles: results,
        taskDetails: {
          id: task.id,
          name: task.name,
          description: task.description
        }
      };
    } catch (error) {
      console.error(`Error downloading task attachments: ${error.message}`);
      throw new Error(`Error downloading task attachments: ${error.message}`);
    }
  }

  /**
   * Get a specific list by ID
   */
  async getList(listId) {
    try {
      // Log the request details
      const url = `/list/${listId}`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);

      return response.data;
    } catch (error) {
      console.error(`API error in getList: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching list: ${error.message}`);
    }
  }

  /**
   * Get all statuses for a list
   */
  async getListStatuses(listId) {
    try {
      // Get the list to get its statuses
      const list = await this.getList(listId);

      // Extract the statuses
      const statuses = list.statuses || [];

      return statuses;
    } catch (error) {
      console.error(`API error in getListStatuses: ${error.message}`);
      throw new Error(`Error fetching list statuses: ${error.message}`);
    }
  }

  /**
   * Get all lists in a folder
   */
  async getLists(folderId) {
    try {
      // Log the request details
      const url = `/folder/${folderId}/list`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);

      return response.data.lists;
    } catch (error) {
      console.error(`API error in getLists: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching lists: ${error.message}`);
    }
  }

  /**
   * Get all lists that are not in any folder (folderless lists)
   */
  async getFolderlessLists(spaceId) {
    try {
      // Log the request details
      const url = `/space/${spaceId}/list`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);

      return response.data.lists;
    } catch (error) {
      console.error(`API error in getFolderlessLists: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching folderless lists: ${error.message}`);
    }
  }

  /**
   * Get all lists in a folder
   */
  async getLists(folderId) {
    try {
      // Log the request details
      const url = `/folder/${folderId}/list`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);

      return response.data.lists;
    } catch (error) {
      console.error(`API error in getLists: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching lists: ${error.message}`);
    }
  }

  /**
   * Get all lists that are not in any folder (folderless lists)
   */
  async getFolderlessLists(spaceId) {
    try {
      // Log the request details
      const url = `/space/${spaceId}/list`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);

      return response.data.lists;
    } catch (error) {
      console.error(`API error in getFolderlessLists: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching folderless lists: ${error.message}`);
    }
  }

  /**
   * Get comments for a task
   */
  async getTaskComments(taskId) {
    try {
      // Log the request details
      const url = `/task/${taskId}/comment`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);

      // Make the API request
      const response = await this.client.get(url);
      console.log(`API response status: ${response.status}`);

      // Process the comments to make them more readable
      const comments = response.data.comments || [];
      const processedComments = comments.map(comment => ({
        id: comment.id,
        text: comment.comment_text,
        user: comment.user ? {
          id: comment.user.id,
          username: comment.user.username,
          email: comment.user.email
        } : null,
        date: new Date(parseInt(comment.date)).toISOString(),
        reactions: comment.reactions || [],
        attachments: comment.attachments || []
      }));

      return processedComments;
    } catch (error) {
      console.error(`API error in getTaskComments: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error fetching task comments: ${error.message}`);
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId, taskData) {
    try {
      // Log the request details
      const url = `/task/${taskId}`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);
      console.log(`Task update data: ${JSON.stringify(taskData)}`);

      // Make the API request
      const response = await this.client.put(url, taskData);
      console.log(`API response status: ${response.status}`);

      return response.data;
    } catch (error) {
      console.error(`API error in updateTask: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  /**
   * Create a new task in a list
   */
  async createTask(listId, taskData) {
    try {
      // Log the request details
      const url = `/list/${listId}/task`;
      console.log(`Making API request to: ${this.client.defaults.baseURL}${url}`);
      console.log(`Task data: ${JSON.stringify(taskData)}`);

      // Make the API request
      const response = await this.client.post(url, taskData);
      console.log(`API response status: ${response.status}`);

      return response.data;
    } catch (error) {
      console.error(`API error in createTask: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error creating task: ${error.message}`);
    }
  }

  /**
   * Upload an attachment to a task
   */
  async createTaskAttachment(taskId, filePath) {
    try {
      // We need to use FormData for file uploads
      const FormData = require('form-data');
      const form = new FormData();

      // Read the file and add it to the form
      const fileStream = fs.createReadStream(filePath);
      form.append('attachment', fileStream);

      // Log the request details
      console.log(`Uploading attachment to task ${taskId} from file ${filePath}`);

      // Make the API request with the form data
      const response = await this.client.post(`/task/${taskId}/attachment`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: this.apiToken
        }
      });

      console.log(`API response status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`API error in createTaskAttachment: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error uploading attachment: ${error.message}`);
    }
  }
}
