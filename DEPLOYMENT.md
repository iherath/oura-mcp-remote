# Railway Deployment Guide

This guide will help you deploy the Oura Remote MCP Server to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push this code to a GitHub repository
3. **Oura API Token**: Get your Personal Access Token from [Oura Cloud](https://cloud.ouraring.com/docs/)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository contains all the necessary files:
- `package.json`
- `tsconfig.json`
- `src/` directory with all TypeScript files
- `Dockerfile`
- `railway.json`

### 2. Deploy to Railway

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables** (Optional):
   - `JWT_SECRET`: A strong secret for JWT tokens
   - `PORT`: Railway will set this automatically

3. **Deploy**:
   - Railway will automatically detect the Node.js project
   - It will run `npm install`, `npm run build`, and `npm start`
   - The deployment will be available at a Railway-provided URL

### 3. Get Your Deployment URL

After deployment, Railway will provide you with a URL like:
```
https://your-app-name.railway.app
```

### 4. Test Your Deployment

Test the health endpoint:
```bash
curl https://your-app-name.railway.app/health
```

Test the MCP discovery:
```bash
curl https://your-app-name.railway.app/.well-known/mcp
```

## Letta Agent Configuration

Once deployed, configure your Letta agent to connect to the Railway-hosted server:

### Server Configuration

- **Server Type**: Streamable HTTP
- **Server Name**: `oura-server` (or any name you prefer)
- **Server URL**: `https://your-app-name.railway.app/sse`
- **Authentication**: Access Token / API Key
- **Access Token**: Your Oura Personal Access Token

### Oura Personal Access Token

1. Go to [Oura Cloud](https://cloud.ouraring.com/docs/)
2. Log in to your account
3. Navigate to Personal Access Tokens
4. Create a new token with appropriate permissions
5. Copy the token and use it as the Access Token in Letta

## Testing the Connection

1. **Test Connection**: Use the "Test connection" button in Letta
2. **Verify Tools**: Once connected, you should see 6 available tools:
   - `get_sleep_data`
   - `get_readiness_data`
   - `get_resilience_data`
   - `get_today_sleep_data`
   - `get_today_readiness_data`
   - `get_today_resilience_data`

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify the Railway URL is correct
   - Check that the server is deployed and running
   - Ensure the Oura API token is valid

2. **Authentication Error**:
   - Verify your Oura Personal Access Token is correct
   - Check that the token has the necessary permissions
   - Test the token with a simple Oura API call

3. **Deployment Issues**:
   - Check Railway logs for build errors
   - Verify all dependencies are in `package.json`
   - Ensure the Dockerfile is correct

### Debug Steps

1. **Check Railway Logs**:
   - Go to your Railway project
   - Click on the deployment
   - Check the logs for any errors

2. **Test Health Endpoint**:
   ```bash
   curl https://your-app-name.railway.app/health
   ```

3. **Test MCP Discovery**:
   ```bash
   curl https://your-app-name.railway.app/.well-known/mcp
   ```

4. **Test with Oura Token**:
   ```bash
   curl -H "Authorization: Bearer YOUR_OURA_TOKEN" \
        https://your-app-name.railway.app/health
   ```

## Security Considerations

- **HTTPS**: Railway provides HTTPS by default
- **Token Security**: Keep your Oura API token secure
- **Rate Limiting**: Consider implementing rate limiting for production
- **Monitoring**: Set up monitoring and alerts in Railway

## Cost Optimization

- **Railway Pricing**: Check Railway's pricing for your usage
- **Auto-scaling**: Railway can auto-scale based on demand
- **Sleep Mode**: Consider using Railway's sleep mode for development

## Updates and Maintenance

1. **Code Updates**: Push changes to GitHub to trigger automatic redeployment
2. **Environment Variables**: Update them in Railway dashboard
3. **Monitoring**: Use Railway's built-in monitoring tools
4. **Logs**: Check logs regularly for any issues 