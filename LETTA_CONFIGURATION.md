# Letta Agent Configuration for Oura MCP Server

This guide shows how to connect your Letta agent to the Oura Remote MCP Server deployed on Railway.

## Prerequisites

1. **Deployed Server**: Your Oura MCP server should be deployed on Railway
2. **Oura Personal Access Token**: Get this from [Oura Cloud](https://cloud.ouraring.com/docs/)
3. **Letta Agent**: Your agent should be hosted in Letta Cloud

## Step-by-Step Configuration

### 1. Get Your Railway Deployment URL

After deploying to Railway, you'll get a URL like:
```
https://your-app-name.railway.app
```

### 2. Get Your Oura Personal Access Token

1. Go to [Oura Cloud](https://cloud.ouraring.com/docs/)
2. Log in to your account
3. Navigate to Personal Access Tokens
4. Create a new token with appropriate permissions
5. Copy the token (it will look like: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`)

### 3. Configure Letta Agent

In your Letta agent configuration:

#### Server Settings
- **Server Type**: `Streamable HTTP`
- **Server Name**: `oura-server` (or any name you prefer)
- **Server URL**: `https://your-app-name.railway.app/sse`

#### Authentication
- **Authentication Method**: `Access Token / API Key`
- **Access Token**: Your Oura Personal Access Token

### 4. Test the Connection

1. Click "Test connection" in Letta
2. If successful, you should see a green checkmark
3. If it fails, check the error message and verify:
   - The Railway URL is correct
   - Your Oura API token is valid
   - The server is running

## Available Tools

Once connected, your Letta agent will have access to these tools:

### Sleep Data
- **`get_sleep_data`**: Get sleep data for a specific date range
  - Parameters: `start_date`, `end_date`, `next_token` (all optional)
- **`get_today_sleep_data`**: Get today's sleep data
  - Parameters: None

### Readiness Data
- **`get_readiness_data`**: Get readiness data for a specific date range
  - Parameters: `start_date`, `end_date`, `next_token` (all optional)
- **`get_today_readiness_data`**: Get today's readiness data
  - Parameters: None

### Resilience Data
- **`get_resilience_data`**: Get resilience data for a specific date range
  - Parameters: `start_date`, `end_date`, `next_token` (all optional)
- **`get_today_resilience_data`**: Get today's resilience data
  - Parameters: None

## Example Usage in Letta

Your Letta agent can now ask questions like:

> "What was my sleep score yesterday?"

> "Show me my readiness data for the past week"

> "What's my current resilience score?"

> "How did I sleep last night?"

## Troubleshooting

### Connection Issues

1. **"Unable to connect" error**:
   - Verify the Railway URL is correct
   - Check that the server is deployed and running
   - Test the health endpoint: `curl https://your-app-name.railway.app/health`

2. **Authentication error**:
   - Verify your Oura Personal Access Token is correct
   - Check that the token has the necessary permissions
   - Test the token with a simple Oura API call

3. **"Server not found" error**:
   - Ensure the URL ends with `/sse`
   - Check that Railway deployment is active
   - Verify the server type is set to "Streamable HTTP"

### Debug Steps

1. **Test Railway deployment**:
   ```bash
   curl https://your-app-name.railway.app/health
   ```

2. **Test MCP discovery**:
   ```bash
   curl https://your-app-name.railway.app/.well-known/mcp
   ```

3. **Test with Oura token**:
   ```bash
   curl -H "Authorization: Bearer YOUR_OURA_TOKEN" \
        https://your-app-name.railway.app/health
   ```

4. **Check Railway logs**:
   - Go to your Railway project
   - Check the deployment logs for any errors

## Security Notes

- **HTTPS**: Railway provides HTTPS by default
- **Token Security**: Keep your Oura API token secure
- **Token Permissions**: Only grant necessary permissions to your Oura token
- **Regular Updates**: Update your Oura token periodically

## Performance Considerations

- **Railway Limits**: Be aware of Railway's usage limits
- **API Rate Limits**: Oura API has rate limits
- **Caching**: Consider implementing caching for frequently accessed data
- **Monitoring**: Set up monitoring for your Railway deployment

## Updates and Maintenance

1. **Server Updates**: Push code changes to trigger Railway redeployment
2. **Token Rotation**: Regularly rotate your Oura API token
3. **Monitoring**: Check Railway logs for any issues
4. **Backup**: Keep a backup of your configuration

## Support

If you encounter issues:

1. Check the Railway deployment logs
2. Verify your Oura API token is valid
3. Test the endpoints manually
4. Check the server health endpoint
5. Review the MCP discovery endpoint 