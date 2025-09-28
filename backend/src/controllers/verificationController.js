import express from 'express';
import multer from 'multer';
import VerificationService from '../services/VerificationServices.js';

const router = express.Router();

// Initialize services
const verificationService = new VerificationService();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
  fileFilter: (req, file, cb) => {
    // Allow documents and voice samples
    const allowedTypes = ['image/', 'application/pdf', 'audio/'];
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    
    if (!isAllowed) {
      cb(new Error('Only images, PDFs, and audio files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * POST /initiate
 * Start user verification process
 */
router.post('/initiate', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'voiceSample', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    // Extract uploaded documents
    const documents = {};
    
    if (req.files.aadhaar) {
      documents.aadhaar = req.files.aadhaar[0].buffer.toString('base64');
    }
    
    if (req.files.pan) {
      documents.pan = req.files.pan[0].buffer.toString('base64');
    }
    
    if (req.files.voiceSample) {
      documents.voiceSample = req.files.voiceSample[0].buffer.toString('base64');
    }

    console.log(`Processing verification for: ${userAddress}`);

    const verificationResult = await verificationService.initiateVerification(
      userAddress, 
      documents
    );

    if (!verificationResult.success) {
      return res.status(400).json(verificationResult);
    }

    res.json({
      success: true,
      message: 'User verification completed successfully',
      data: verificationResult.user
    });

  } catch (error) {
    console.error('Verification initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification process failed',
      details: error.message
    });
  }
});

/**
 * GET /user/:address
 * Get user verification status
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const result = verificationService.getUserVerification(address);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      data: result.user
    });

  } catch (error) {
    console.error('Get user verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user verification',
      details: error.message
    });
  }
});

/**
 * POST /filter
 * Filter users by demographics
 */
router.post('/filter', async (req, res) => {
  try {
    const filters = req.body;

    console.log('Filtering users with criteria:', filters);

    const result = verificationService.filterUsersByDemographics(filters);

    res.json({
      success: true,
      message: `Found ${result.count} users matching criteria`,
      data: result.users,
      filters: filters
    });

  } catch (error) {
    console.error('User filtering error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter users',
      details: error.message
    });
  }
});

/**
 * GET /stats
 * Get verification statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = verificationService.getVerificationStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification statistics',
      details: error.message
    });
  }
});

/**
 * POST /dataset/create
 * Create voice dataset based on demographic filters
 */
router.post('/dataset/create', async (req, res) => {
  try {
    const { filters, requestedBy, useCase } = req.body;

    if (!filters || !requestedBy) {
      return res.status(400).json({
        success: false,
        error: 'Filters and requestedBy are required'
      });
    }

    console.log(`Creating dataset for: ${requestedBy} with filters:`, filters);

    const filteredUsers = verificationService.filterUsersByDemographics(filters);

    if (!filteredUsers.success || filteredUsers.users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found matching the specified criteria',
        filters: filters
      });
    }

    const datasetId = `DS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const dataset = {
      datasetId,
      requestedBy,
      useCase: useCase || 'AI Training',
      filters,
      userCount: filteredUsers.users.length,
      users: filteredUsers.users,
      createdAt: new Date().toISOString(),
      status: 'ready'
    };

    res.json({
      success: true,
      message: `Dataset created with ${filteredUsers.users.length} voice samples`,
      data: dataset
    });

  } catch (error) {
    console.error('Dataset creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dataset',
      details: error.message
    });
  }
});

export default router;
