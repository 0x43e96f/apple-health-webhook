require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware to parse JSON
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} from ${req.ip}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`  Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Validate API key middleware
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    console.error('[ERROR] Missing API key');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }

  if (apiKey !== process.env.API_KEY) {
    console.error('[ERROR] Invalid API key');
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }

  next();
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'railway-health-webhook',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    target: process.env.OPENCLAW_WEBHOOK_URL || 'not configured'
  });
});

// Main webhook endpoint
app.post('/webhook/health', validateApiKey, async (req, res) => {
  try {
    const payload = req.body;

    // Add source identifier
    payload.source = 'apple-health-webhook';

    // Add received timestamp if not present
    if (!payload.data || !payload.data.receivedAt) {
      if (!payload.data) payload.data = {};
      payload.data.receivedAt = new Date().toISOString();
    }

    console.log('[INFO] Forwarding health data to OpenClaw:', process.env.OPENCLAW_WEBHOOK_URL);

    // Forward to OpenClaw Health Data Receiver
    if (!process.env.OPENCLAW_WEBHOOK_URL) {
      console.error('[ERROR] OPENCLAW_WEBHOOK_URL not configured');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'OpenClaw webhook URL not configured'
      });
    }

    const forwardResponse = await axios.post(
      process.env.OPENCLAW_WEBHOOK_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('[INFO] Forward successful:', forwardResponse.status);
    console.log('[INFO] Response:', JSON.stringify(forwardResponse.data, null, 2));

    res.status(200).json({
      status: 'success',
      message: 'Health data received and forwarded',
      forwardedAt: new Date().toISOString(),
      target: process.env.OPENCLAW_WEBHOOK_URL,
      openClawResponse: forwardResponse.data
    });

  } catch (error) {
    console.error('[ERROR] Failed to forward health data:', error.message);

    if (error.response) {
      // OpenClaw responded with error status
      console.error('[ERROR] OpenClaw response:', error.response.status, error.response.data);
      res.status(error.response.status).json({
        error: 'Forward failed',
        message: error.response.data?.message || 'Unknown error',
        openClawStatus: error.response.status
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('[ERROR] No response from OpenClaw');
      res.status(502).json({
        error: 'Bad gateway',
        message: 'OpenClaw service is unavailable'
      });
    } else {
      // Something happened in setting up the request
      console.error('[ERROR] Request setup error:', error.message);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Test endpoint (for debugging)
app.get('/test', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'railway-health-webhook',
    configuration: {
      OPENCLAW_WEBHOOK_URL: process.env.OPENCLAW_WEBHOOK_URL ? 'configured' : 'not configured',
      API_KEY: process.env.API_KEY ? 'configured' : 'not configured',
      PORT: process.env.PORT || '8080'
    },
    availableEndpoints: [
      'GET /',
      'POST /webhook/health (requires API key)',
      'GET /test'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Railway Health Webhook server listening on port ${PORT}`);
  console.log(`[INFO] Health check: http://localhost:${PORT}/`);
  console.log(`[INFO] Webhook endpoint: http://localhost:${PORT}/webhook/health`);
  console.log(`[INFO] Test endpoint: http://localhost:${PORT}/test`);
  console.log(`[INFO] Forwarding to: ${process.env.OPENCLAW_WEBHOOK_URL || 'not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT received, shutting down gracefully');
  process.exit(0);
});
