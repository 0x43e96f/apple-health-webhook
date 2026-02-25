# Railway Health Webhook Server

A secure webhook server deployed on Railway that forwards Apple Watch health data to OpenClaw.

## Features

- ✅ API key authentication for security
- ✅ Rate limiting to prevent abuse
- ✅ Request logging for debugging
- ✅ Graceful error handling
- ✅ Health check endpoint
- ✅ Automatic forwarding to OpenClaw Health Data Receiver

## Architecture

```
iOS Shortcuts → Railway Webhook → OpenClaw Health Data Receiver → Morning Report
```

## Environment Variables

Create a `.env` file in the project root:

```env
API_KEY=your-secure-api-key-here
OPENCLAW_WEBHOOK_URL=http://localhost:8080/webhook/health-data
PORT=8080
```

### API Key Generation

Generate a secure API key:

```bash
# Linux/Mac
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Webhook Endpoint

### POST /webhook/health

Headers:
- `X-API-Key`: Your API key (or use `?apiKey=` query parameter)

Request body:

```json
{
  "data": {
    "heartRate": 68,
    "sleepDuration": 7.5,
    "steps": 4500,
    "timestamp": "2024-02-24T08:00:00Z"
  },
  "trigger": "morning-report"
}
```

Response:

```json
{
  "status": "success",
  "message": "Health data received and forwarded",
  "forwardedAt": "2024-02-24T08:00:00Z",
  "target": "http://localhost:8080/webhook/health-data",
  "openClawResponse": {
    "status": "success",
    "message": "Health data received and saved"
  }
}
```

## Local Testing

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start server:
```bash
npm start
```

4. Test webhook:
```bash
curl -X POST http://localhost:8080/webhook/health \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "data": {
      "heartRate": 68,
      "sleepDuration": 7.5,
      "steps": 4500,
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    "trigger": "morning-report"
  }'
```

## Deployment to Railway

### Option 1: One-line deployment (requires GitHub repo)

```bash
# First, push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main

# Then deploy via Railway CLI
railway up
```

### Option 2: Deploy via Railway Dashboard

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select this repository
4. Railway will auto-detect the Node.js project
5. Set environment variables in Railway dashboard:
   - `API_KEY`: Your secure API key
   - `OPENCLAW_WEBHOOK_URL`: Your OpenClaw Gateway URL (e.g., `https://your-domain.com/webhook/health-data`)

### Option 3: One-click deployment script

```bash
./deploy-to-railway.sh
```

## iOS Shortcuts Configuration

In your iOS Shortcuts app:

1. Create a new shortcut
2. Add "Get Health Data" action (for heart rate, sleep, steps)
3. Add "Get Date" action for timestamp
4. Add "Get Contents of URL" action:
   - URL: `https://your-railway-project.railway.app/webhook/health`
   - Method: POST
   - Headers: Add `X-API-Key` with your API key
   - Request Body: JSON
   ```json
   {
     "data": {
       "heartRate": {HeartRate},
       "sleepDuration": {SleepDuration},
       "steps": {Steps},
       "timestamp": {Timestamp}
     },
     "trigger": "morning-report"
   }
   ```

## Monitoring

### Check service health:
```bash
curl https://your-railway-project.railway.app/
```

### Check configuration:
```bash
curl https://your-railway-project.railway.app/test
```

## Troubleshooting

### API key error
- Ensure `X-API-Key` header is set correctly
- Check that API key matches Railway environment variable

### OpenClaw connection error
- Verify `OPENCLAW_WEBHOOK_URL` is correct
- Check that OpenClaw Gateway is running
- Review Railway logs for connection errors

### Rate limiting
- Default: 100 requests per 15 minutes per IP
- Adjust in `index.js` if needed

## Security Notes

- Always use HTTPS in production
- Keep API keys secret
- Don't commit `.env` file
- Regularly rotate API keys
- Monitor Railway logs for suspicious activity

## License

MIT
