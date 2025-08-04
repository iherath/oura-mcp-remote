import { RemoteMCPServer } from './server.js';

async function main() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new RemoteMCPServer();
  
  try {
    console.log(`🚀 Starting Oura Remote MCP Server on port ${port}...`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Process ID: ${process.pid}`);
    
    await server.start(port);
    
    console.log(`✅ Oura Remote MCP Server started successfully on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔍 MCP discovery: http://localhost:${port}/.well-known/mcp`);
    console.log(`🔗 MCP endpoint: http://localhost:${port}/sse`);
    console.log(`📝 Register test user: POST http://localhost:${port}/register`);
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error); 