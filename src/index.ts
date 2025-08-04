import { RemoteMCPServer } from './server.js';

async function main() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new RemoteMCPServer();
  
  try {
    await server.start(port);
    console.log(`🚀 Oura Remote MCP Server started successfully on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔍 MCP discovery: http://localhost:${port}/.well-known/mcp`);
    console.log(`🔗 MCP endpoint: http://localhost:${port}/sse`);
    console.log(`📝 Register test user: POST http://localhost:${port}/register`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error); 