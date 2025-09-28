import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import controllers
import audioController from './controllers/audioController.js';
import verificationController from './controllers/verificationController.js';
import nftController from './controllers/nftController.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import utilities
import logger from './utils/logger.js';
import { successResponse } from './utils/helpers.js';
import { API_ROUTES } from './utils/constants.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get(API_ROUTES.HEALTH, (req, res) => {
  res.json(successResponse('SONIC API is running', {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      lighthouse: 'connected',
      verification: 'active',
      flow: 'connected'
    },
    uptime: process.uptime()
  }));
});

// API Routes
app.use(API_ROUTES.AUDIO.BASE, audioController);
app.use(API_ROUTES.VERIFICATION.BASE, verificationController);
app.use(API_ROUTES.NFT.BASE, nftController);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🎵 SONIC API Server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: `http://localhost:${PORT}${API_ROUTES.HEALTH}`,
      audio: `http://localhost:${PORT}${API_ROUTES.AUDIO.BASE}`,
      verification: `http://localhost:${PORT}${API_ROUTES.VERIFICATION.BASE}`,
      nft: `http://localhost:${PORT}${API_ROUTES.NFT.BASE}`
    }
  });
});

export default app;
