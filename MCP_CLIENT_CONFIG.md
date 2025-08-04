# MCP Client Configuration for Oura Remote Server

This guide shows how to configure various MCP clients to use the Oura Remote MCP Server.

## Prerequisites

1. **Oura API Token**: Get your token from [Oura Cloud API](https://cloud.ouraring.com/docs/)
2. **Server Running**: The Oura Remote MCP Server should be running on your desired host

## Claude Desktop Configuration

Edit the configuration file at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "oura-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3000/sse"
      ]
    }
  }
}
```

For production with HTTPS:
```json
{
  "mcpServers": {
    "oura-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-domain.com/sse"
      ]
    }
  }
}
```

## Cursor Configuration

Edit the configuration file at `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "oura-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3000/sse"
      ]
    }
  }
}
```

## Windsurf Configuration

Edit the configuration file at `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "oura-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3000/sse"
      ]
    }
  }
}
```

## Authentication Flow

The server implements OAuth 2.0 authentication. When you first connect:

1. **Discovery**: Client discovers server capabilities at `/.well-known/mcp`
2. **Authorization**: Client redirects to `/oauth/authorize`
3. **Login**: User enters credentials and Oura API token
4. **Token Exchange**: Client exchanges authorization code for access token
5. **MCP Communication**: Client connects to `/sse` with Bearer token

## Available Tools

Once connected, you'll have access to these tools:

### Sleep Data
- `get_sleep_data` - Get sleep data for a date range
- `get_today_sleep_data` - Get today's sleep data

### Readiness Data
- `get_readiness_data` - Get readiness data for a date range
- `get_today_readiness_data` - Get today's readiness data

### Resilience Data
- `get_resilience_data` - Get resilience data for a date range
- `get_today_resilience_data` - Get today's resilience data

## Example Usage

After configuration, you can ask Claude:

> "What was my sleep score yesterday?"

> "Show me my readiness data for the past week"

> "What's my current resilience score?"

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure the server is running and accessible
2. **Authentication Error**: Check your Oura API token is valid
3. **Tool Not Found**: Restart your MCP client after configuration changes

### Debug Steps

1. Test server health: `curl http://localhost:3000/health`
2. Check MCP discovery: `curl http://localhost:3000/.well-known/mcp`
3. Verify Oura token: Test with a simple API call

### Environment Variables

For development, you can set:
- `TEST_OURA_TOKEN` - Your Oura API token for testing
- `JWT_SECRET` - Secret for JWT tokens (use strong secret in production)
- `PORT` - Server port (default: 3000)

## Security Notes

- Use HTTPS in production
- Set a strong JWT_SECRET
- Keep your Oura API token secure
- Consider implementing rate limiting 