import axios from "axios";

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
   * Get all authorized workspaces
   */
  async getWorkspaces() {
    try {
      const response = await this.client.get("/team");
      return response.data.teams;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get all spaces in a workspace
   */
  async getSpaces(workspaceId) {
    try {
      const response = await this.client.get(`/team/${workspaceId}/space`);
      return response.data.spaces;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get all folders in a space
   */
  async getFolders(spaceId) {
    try {
      const response = await this.client.get(`/space/${spaceId}/folder`);
      return response.data.folders;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get all lists in a folder
   */
  async getLists(folderId) {
    try {
      const response = await this.client.get(`/folder/${folderId}/list`);
      return response.data.lists;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get all lists that are not in any folder
   */
  async getFolderlessLists(spaceId) {
    try {
      const response = await this.client.get(`/space/${spaceId}/list`);
      return response.data.lists;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get tasks from a list
   */
  async getTasks(listId, page = 0) {
    try {
      const response = await this.client.get(`/list/${listId}/task`, {
        params: {
          page,
        },
      });
      return response.data.tasks;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId) {
    try {
      const response = await this.client.get(`/task/${taskId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Create a new task in a list
   */
  async createTask(listId, taskData) {
    try {
      const response = await this.client.post(`/list/${listId}/task`, taskData);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId, taskData) {
    try {
      const response = await this.client.put(`/task/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get comments for a task
   */
  async getTaskComments(taskId) {
    try {
      const response = await this.client.get(`/task/${taskId}/comment`);
      return response.data.comments;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Create a comment on a task
   */
  async createTaskComment(taskId, commentText) {
    try {
      const response = await this.client.post(`/task/${taskId}/comment`, {
        comment_text: commentText,
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get time entries for a task
   */
  async getTimeEntries(taskId) {
    try {
      const response = await this.client.get(`/task/${taskId}/time`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Create a time entry for a task
   */
  async createTimeEntry(taskId, timeData) {
    try {
      const response = await this.client.post(`/task/${taskId}/time`, timeData);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Search for tasks across a workspace
   */
  async searchTasks(workspaceId, query, page = 0) {
    try {
      const response = await this.client.get(`/team/${workspaceId}/task`, {
        params: {
          page,
          search_text: query,
        },
      });
      return response.data.tasks;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleApiError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      throw new Error(`ClickUp API error (${status}): ${JSON.stringify(data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`ClickUp API request error: No response received`);
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`ClickUp API error: ${error.message}`);
    }
  }
}
