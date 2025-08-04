import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { OuraClient, OuraAPIError, DateRangeParams } from './oura-client.js';
import { UserManager, UserSession } from './user-manager.js';

export class OuraMCPServer {
  private server: Server;
  private userManager: UserManager;

  constructor(userManager: UserManager) {
    this.userManager = userManager;
    this.server = new Server(
      {
        name: 'oura-mcp-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_sleep_data',
            description: 'Get sleep data for a specific date range',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: {
                  type: 'string',
                  description: 'Start date in ISO format (YYYY-MM-DD)',
                },
                end_date: {
                  type: 'string',
                  description: 'End date in ISO format (YYYY-MM-DD)',
                },
                next_token: {
                  type: 'string',
                  description: 'Token for pagination',
                },
              },
            },
          },
          {
            name: 'get_readiness_data',
            description: 'Get readiness data for a specific date range',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: {
                  type: 'string',
                  description: 'Start date in ISO format (YYYY-MM-DD)',
                },
                end_date: {
                  type: 'string',
                  description: 'End date in ISO format (YYYY-MM-DD)',
                },
                next_token: {
                  type: 'string',
                  description: 'Token for pagination',
                },
              },
            },
          },
          {
            name: 'get_resilience_data',
            description: 'Get resilience data for a specific date range',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: {
                  type: 'string',
                  description: 'Start date in ISO format (YYYY-MM-DD)',
                },
                end_date: {
                  type: 'string',
                  description: 'End date in ISO format (YYYY-MM-DD)',
                },
                next_token: {
                  type: 'string',
                  description: 'Token for pagination',
                },
              },
            },
          },
          {
            name: 'get_today_sleep_data',
            description: 'Get sleep data for today',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_today_readiness_data',
            description: 'Get readiness data for today',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_today_resilience_data',
            description: 'Get resilience data for today',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // For now, we'll use a default user session since this is a remote server
      // In a real implementation, you'd extract this from the request context
      const defaultUserSession: UserSession = {
        userId: 'default-user',
        username: 'default',
        email: 'default@example.com',
      };

      const ouraToken = this.userManager.getUserOuraToken(defaultUserSession.userId);
      if (!ouraToken) {
        throw new Error('Oura API token not found for user');
      }

      const ouraClient = new OuraClient(ouraToken);

      try {
        return await this.handleToolCall(name, args, ouraClient);
      } catch (error) {
        if (error instanceof OuraAPIError) {
          throw new Error(`Oura API Error: ${(error as Error).message}`);
        }
        throw error;
      }
    });
  }

  private async handleToolCall(name: string, args: any, ouraClient: OuraClient): Promise<any> {
    const dateRangeParams: DateRangeParams = {
      start_date: args?.start_date,
      end_date: args?.end_date,
      next_token: args?.next_token,
    };

    switch (name) {
      case 'get_sleep_data':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ouraClient.getSleep(dateRangeParams), null, 2),
            },
          ],
        };

      case 'get_readiness_data':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ouraClient.getReadiness(dateRangeParams), null, 2),
            },
          ],
        };

      case 'get_resilience_data':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ouraClient.getResilience(dateRangeParams), null, 2),
            },
          ],
        };

      case 'get_today_sleep_data':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ouraClient.getTodaySleep(), null, 2),
            },
          ],
        };

      case 'get_today_readiness_data':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ouraClient.getTodayReadiness(), null, 2),
            },
          ],
        };

      case 'get_today_resilience_data':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ouraClient.getTodayResilience(), null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  getServer(): Server {
    return this.server;
  }
}