import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { OuraMCPServer } from './mcp-server.js';
import { UserManager, UserSession } from './user-manager.js';
import { OuraClient } from './oura-client.js';

export class RemoteMCPServer {
  private app: express.Application;
  private mcpServer: OuraMCPServer;
  private userManager: UserManager;

  constructor() {
    this.app = express();
    this.userManager = new UserManager(process.env.JWT_SECRET || 'your-secret-key');
    this.mcpServer = new OuraMCPServer(this.userManager);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
      credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      console.log('Health check requested');
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid
      });
    });

    // MCP discovery endpoint
    this.app.get('/.well-known/mcp', (req, res) => {
      res.json({
        name: 'Oura Remote MCP Server',
        version: '1.0.0',
        capabilities: {
          tools: {},
          resources: {}
        },
        auth: {
          type: 'bearer',
          description: 'Use your Oura Personal Access Token as the Bearer token',
        },
        endpoints: {
          streamable: '/mcp'
        }
      });
    });

    // OAuth authorization endpoint
    this.app.get('/oauth/authorize', (req, res) => {
      const { client_id, redirect_uri, scope, state } = req.query;

      // For simplicity, we'll redirect to a simple auth page
      // In production, you'd want a proper OAuth flow
      const authUrl = `${req.protocol}://${req.get('host')}/auth/login?` +
        `client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;

      res.redirect(authUrl);
    });

    // Simple auth login page
    this.app.get('/auth/login', (req, res) => {
      const { client_id, redirect_uri, scope, state } = req.query;

      res.send(`
        <html>
          <head><title>Oura MCP Server - Login</title></head>
          <body>
            <h1>Login to Oura MCP Server</h1>
            <form method="POST" action="/auth/login">
              <input type="hidden" name="client_id" value="${client_id}">
              <input type="hidden" name="redirect_uri" value="${redirect_uri}">
              <input type="hidden" name="scope" value="${scope}">
              <input type="hidden" name="state" value="${state}">
              <p>
                <label>Email: <input type="email" name="email" required></label>
              </p>
              <p>
                <label>Password: <input type="password" name="password" required></label>
              </p>
              <p>
                <label>Oura API Token: <input type="text" name="oura_token" required></label>
              </p>
              <button type="submit">Login</button>
            </form>
          </body>
        </html>
      `);
    });

    // Handle auth login
    this.app.post('/auth/login', async (req, res) => {
      const { client_id, redirect_uri, scope, state, email, password, oura_token } = req.body;

      try {
        // Try to authenticate user
        const token = await this.userManager.authenticateUser(email, password);

        // Update Oura token
        const userSession = await this.userManager.validateToken(token);
        await this.userManager.updateOuraToken(userSession.userId, oura_token);

        // Redirect back to client with authorization code
        const authCode = Buffer.from(`${userSession.userId}:${Date.now()}`).toString('base64');
        const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state}`;

        res.redirect(redirectUrl);
      } catch (error) {
        res.status(400).send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>${(error as Error).message}</p>
              <a href="/auth/login?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}">Try Again</a>
            </body>
          </html>
        `);
      }
    });

    // OAuth token endpoint
    this.app.post('/oauth/token', async (req, res) => {
      const { grant_type, code, client_id } = req.body;

      if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
      }

      try {
        // Decode the authorization code
        const decoded = Buffer.from(code, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');

        // Check if code is not too old (5 minutes)
        const codeAge = Date.now() - parseInt(timestamp);
        if (codeAge > 5 * 60 * 1000) {
          return res.status(400).json({ error: 'invalid_grant' });
        }

        // Get user session
        const user = this.userManager.getAllUsers().find(u => u.id === userId);
        if (!user) {
          return res.status(400).json({ error: 'invalid_grant' });
        }

        // Generate access token
        const accessToken = await this.userManager.authenticateUser(user.email, 'dummy'); // We already know the user

        res.json({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 86400, // 24 hours
          scope: 'oura:read',
        });
      } catch (error) {
        res.status(400).json({ error: 'invalid_grant' });
      }
    });

    // User registration (for development)
    this.app.post('/register', async (req, res) => {
      try {
        const { username, email, password, ouraApiToken } = req.body;

        if (!username || !email || !password || !ouraApiToken) {
          return res.status(400).json({
            error: 'Missing required fields: username, email, password, ouraApiToken'
          });
        }

        const user = await this.userManager.registerUser(username, email, password, ouraApiToken);

        res.status(201).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
          },
        });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    });

    // Test endpoint without authentication
    this.app.get('/test', (req, res) => {
      console.log('Test endpoint hit');
      res.json({ status: 'ok', message: 'Test endpoint working' });
    });

    // Handle OPTIONS requests for CORS
    this.app.options('/sse', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
      res.status(200).end();
    });

    // MCP Streamable HTTP endpoint (GET)
    this.app.get('/sse', this.authenticateRequest.bind(this), this.handleStreamableHTTP.bind(this));

    // MCP Streamable HTTP endpoint (POST) - for Letta compatibility
    this.app.post('/sse', this.authenticateRequest.bind(this), this.handleStreamableHTTP.bind(this));

    // MCP endpoint for Letta (Streamable HTTP) - based on Letta docs
    this.app.get('/mcp', this.authenticateRequest.bind(this), this.handleStreamableHTTP.bind(this));
    this.app.post('/mcp', this.authenticateRequest.bind(this), this.handleStreamableHTTP.bind(this));

    // Root MCP endpoint for Letta (Streamable HTTP) - fallback
    this.app.get('/', this.authenticateRequest.bind(this), this.handleStreamableHTTP.bind(this));
    this.app.post('/', this.authenticateRequest.bind(this), this.handleStreamableHTTP.bind(this));

    // Root endpoint (fallback for non-MCP requests)
    this.app.get('/info', (req, res) => {
      console.log('Info endpoint requested');
      res.json({
        name: 'Oura Remote MCP Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          mcp_discovery: '/.well-known/mcp',
          oauth_authorize: '/oauth/authorize',
          oauth_token: '/oauth/token',
          register: 'POST /register',
          mcp: '/sse',
          streamable_mcp: '/mcp',
          root_mcp: '/',
        },
      });
    });
  }

  private async authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      console.log('Authentication request received');
      console.log('Headers:', req.headers);
      console.log('Method:', req.method);
      console.log('URL:', req.url);

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Missing or invalid Authorization header');
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
      }

      const token = authHeader.slice(7);

      // Check if this is an Oura API key (direct authentication)
      if (token.length > 20 && !token.includes('.')) {
        console.log('Attempting Oura API key validation...');
        // This looks like an Oura API key - validate it
        try {
          const ouraClient = new OuraClient(token);
          const isValid = await ouraClient.validateToken();
          console.log('Oura API key validation result:', isValid);

          if (isValid) {
            // Create a user session for this Oura API key
            const userSession: UserSession = {
              userId: `oura_${Buffer.from(token).toString('base64').slice(0, 10)}`,
              username: 'oura_user',
              email: 'oura_user@example.com',
            };

            // Store the Oura token for this session
            this.userManager.storeOuraTokenForSession(userSession.userId, token);
            console.log('Oura API key validation successful');

            (req as any).userSession = userSession;
            next();
            return;
          } else {
            console.log('Oura API key validation failed - token invalid');
            res.status(401).json({ error: 'Invalid Oura API key' });
            return;
          }
        } catch (error) {
          console.log('Oura API key validation error:', error);
          // Oura API key validation failed
          res.status(401).json({ error: 'Invalid Oura API key' });
          return;
        }
      }

      // Try JWT token authentication (for registered users)
      try {
        const userSession = await this.userManager.validateToken(token);
        (req as any).userSession = userSession;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
      }
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  private async handleStreamableHTTP(req: express.Request, res: express.Response): Promise<void> {
    const userSession = (req as any).userSession as UserSession;

    console.log('Streamable HTTP connection established for user:', userSession.userId);

    // Set Streamable HTTP headers
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'X-Accel-Buffering': 'no'
    });

    // Don't send any initial messages - wait for Letta to initiate
    console.log('Connection established, waiting for Letta to send MCP requests...');

    // Send a simple heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      res.write(JSON.stringify(heartbeatMessage) + '\n');
      console.log('Sent heartbeat');
    }, 30000);

    console.log('Waiting for MCP client request...');

    // Handle MCP messages
    req.on('data', async (chunk) => {
      try {
        const rawData = chunk.toString();
        console.log('=== MCP REQUEST RECEIVED ===');
        console.log('Raw data:', rawData);
        console.log('Data length:', rawData.length);
        console.log('=============================');

        // Handle empty or malformed data
        if (!rawData.trim()) {
          console.log('Empty request received, ignoring');
          return;
        }

        const data = JSON.parse(rawData);
        console.log('Parsed MCP request:', JSON.stringify(data, null, 2));

        // Handle MCP initialization request
        if (data.method === 'initialize') {
          console.log('Handling MCP initialize request');
          const initResponse = {
            jsonrpc: '2.0',
            id: data.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: {
                name: 'oura-mcp-server',
                version: '1.0.0'
              }
            }
          };
          res.write(JSON.stringify(initResponse) + '\n');
          console.log('Sent MCP initialize response:', initResponse);
          return;
        }

        // Handle MCP list tools request
        if (data.method === 'tools/list') {
          console.log('Handling MCP list tools request');
          const toolsResponse = {
            jsonrpc: '2.0',
            id: data.id,
            result: {
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
              ]
            }
          };
          res.write(JSON.stringify(toolsResponse) + '\n');
          console.log('Sent MCP list tools response:', toolsResponse);
          return;
        }

        // Handle MCP tool call request
        if (data.method === 'tools/call') {
          console.log('Handling MCP tool call request:', data.params);
          try {
            const server = this.mcpServer.getServer();
            const response = await server.request(data, {} as any);
            res.write(JSON.stringify(response) + '\n');
            console.log('Sent MCP tool call response:', response);
          } catch (toolError) {
            console.log('Tool call error:', toolError);
            const errorResponse = {
              jsonrpc: '2.0',
              id: data.id,
              error: {
                code: -32603,
                message: (toolError as Error).message,
              },
            };
            res.write(JSON.stringify(errorResponse) + '\n');
          }
          return;
        }

        // Process other MCP requests
        const server = this.mcpServer.getServer();
        const response = await server.request(data, {} as any);

        // Send response back via Streamable HTTP
        console.log('Sending MCP response:', response);
        res.write(JSON.stringify(response) + '\n');
      } catch (error) {
        console.log('MCP request error:', error);
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: (error as Error).message,
          },
        };
        res.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log('Streamable HTTP connection closed by client');
      clearInterval(heartbeatInterval);
      res.end();
    });

    req.on('error', (error) => {
      console.error('Streamable HTTP connection error:', error);
      clearInterval(heartbeatInterval);
      res.end();
    });
  }

  async start(port: number = 3000): Promise<void> {
    // Load test users in development
    await this.userManager.loadTestUsers();

    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, '0.0.0.0', () => {
        console.log(`✅ Oura Remote MCP Server running on port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`🔍 MCP discovery: http://localhost:${port}/.well-known/mcp`);
        console.log(`🔗 MCP endpoint: http://localhost:${port}/sse`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('❌ Server error:', error);
        reject(error);
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}