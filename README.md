# Oura Remote MCP Server

A remote Model Context Protocol (MCP) server that provides access to Oura ring health data including sleep, readiness, and resilience metrics.

## Features

- 🔐 **OAuth 2.0 Authentication**: Secure authentication flow for MCP clients
- 📊 **Oura API Integration**: Full access to Oura ring data
- 🛠️ **MCP Tools**: Six tools for querying health data
- 🔄 **Server-Sent Events**: Real-time MCP communication
- 👤 **User Management**: Multi-user support with individual Oura tokens

## Available Tools

1. **`get_sleep_data`** - Get sleep data for a specific date range
2. **`get_readiness_data`** - Get readiness data for a specific date range  
3. **`get_resilience_data`** - Get resilience data for a specific date range
4. **`get_today_sleep_data`** - Get sleep data for today
5. **`get_today_readiness_data`** - Get readiness data for today
6. **`get_today_resilience_data`** - Get resilience data for today

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd oura-mcp-remote

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens (default: 'your-secret-key')
- `TEST_OURA_TOKEN` - Test Oura API token for development

### Oura API Token

You'll need an Oura API token to use this server. Get one from the [Oura Cloud API](https://cloud.ouraring.com/docs/).

## Usage

### 1. Register a User

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "email": "your-email@example.com", 
    "password": "your-password",
    "ouraApiToken": "your-oura-api-token"
  }'
```

### 2. Configure MCP Client

Add this to your MCP client configuration:

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

For production with OAuth:

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

### 3. OAuth Flow

The server implements OAuth 2.0 for secure authentication:

1. **Discovery**: `GET /.well-known/mcp`
2. **Authorization**: `GET /oauth/authorize`
3. **Token Exchange**: `POST /oauth/token`
4. **MCP Communication**: `GET /sse`

## API Endpoints

- `GET /health` - Health check
- `GET /.well-known/mcp` - MCP server discovery
- `GET /oauth/authorize` - OAuth authorization endpoint
- `POST /oauth/token` - OAuth token endpoint
- `GET /auth/login` - Login page
- `POST /register` - User registration (development)
- `GET /sse` - MCP Server-Sent Events endpoint

## MCP Tools Reference

### get_sleep_data
Get sleep data for a specific date range.

**Parameters:**
- `start_date` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `end_date` (string, optional): End date in ISO format (YYYY-MM-DD)
- `next_token` (string, optional): Token for pagination

### get_readiness_data
Get readiness data for a specific date range.

**Parameters:**
- `start_date` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `end_date` (string, optional): End date in ISO format (YYYY-MM-DD)
- `next_token` (string, optional): Token for pagination

### get_resilience_data
Get resilience data for a specific date range.

**Parameters:**
- `start_date` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `end_date` (string, optional): End date in ISO format (YYYY-MM-DD)
- `next_token` (string, optional): Token for pagination

### get_today_sleep_data
Get sleep data for today.

**Parameters:** None

### get_today_readiness_data
Get readiness data for today.

**Parameters:** None

### get_today_resilience_data
Get resilience data for today.

**Parameters:** None

## Deployment

### Local Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Security Considerations

- Use HTTPS in production
- Set a strong `JWT_SECRET`
- Implement rate limiting
- Add proper CORS configuration
- Use environment variables for sensitive data

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `npm install`
2. **Oura API errors**: Verify your API token is valid
3. **Authentication errors**: Check JWT token expiration
4. **SSE connection issues**: Verify client supports Server-Sent Events

### Debug Mode

Set `NODE_ENV=development` for additional logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the [MCP documentation](https://modelcontextprotocol.io/)
- Review the [Oura API documentation](https://cloud.ouraring.com/docs/) 