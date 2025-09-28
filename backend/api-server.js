import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

import LighthouseService from '../lighthouse/lighthouse-service.js';
import { mintAudioNFT } from './flow-service.js';
import VerificationService from '../verification/models/services/VerificationServices.js';

dotenv.config();
console.log('Loaded LIGHTHOUSE_API_KEY:', process.env.LIGHTHOUSE_API_KEY ? 'Yes' : 'No');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const lighthouseService = new LighthouseService();
const verificationService = new VerificationService();

// Configure multer for memory storage and 50MB file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Allow audio files and documents for verification
    if (file.fieldname === 'audio' && !file.mimetype.startsWith('audio/')) {
      cb(new Error('Only audio files are allowed for audio upload'), false);
    } else {
      cb(null, true);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'API is running',
    services: {
      lighthouse: 'connected',
      verification: 'active',
      flow: 'connected'
    }
  });
});

// =============================================
// VERIFICATION ENDPOINTS
// =============================================

/**
 * POST /api/verification/initiate
 * Start user verification process
 */
app.post('/api/verification/initiate', upload.fields([
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
 * GET /api/verification/user/:address
 * Get user verification status
 */
app.get('/api/verification/user/:address', async (req, res) => {
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
 * POST /api/verification/filter
 * Filter users by demographics
 */
app.post('/api/verification/filter', async (req, res) => {
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
 * GET /api/verification/stats
 * Get verification statistics
 */
app.get('/api/verification/stats', async (req, res) => {
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

// =============================================
// AUDIO ENDPOINTS
// =============================================

/**
 * POST /api/audio/upload
 * Upload and encrypt audio, store on IPFS via Lighthouse
 */
app.post('/api/audio/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    const { buffer, originalname } = req.file;
    const { userAddress } = req.body;

    // Check if user is verified (optional enforcement)
    if (userAddress) {
      const userVerification = verificationService.getUserVerification(userAddress);
      if (userVerification.success && userVerification.user.isVerified) {
        console.log(`✅ Verified user uploading: ${userAddress}`);
      } else {
        console.log(`⚠️ Unverified user uploading: ${userAddress}`);
      }
    }

    const metadata = {
      uploadedBy: userAddress || 'unknown',
      originalName: originalname,
      fileType: req.file.mimetype,
      uploadTimestamp: new Date().toISOString()
    };

    console.log(`Processing audio upload: ${originalname}`);

    const uploadResult = await lighthouseService.processAndUploadAudio(buffer, originalname);

    if (!uploadResult.ipfsCID) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload audio to IPFS',
        details: 'No IPFS CID returned'
      });
    }

    res.json({
      success: true,
      message: 'Audio uploaded successfully',
      data: {
        ipfsCID: uploadResult.ipfsCID,
        encryptionKey: uploadResult.encryptionKey,
        fileName: originalname,
        fileSize: buffer.length,
        gatewayUrl: uploadResult.gatewayURL,
        userAddress: userAddress
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during upload',
      details: error.message
    });
  }
});

// =============================================
// NFT ENDPOINTS
// =============================================

/**
 * POST /api/nft/mint
 * Mint Audio NFT on Flow blockchain with verification data
 */
app.post('/api/nft/mint', async (req, res) => {
  try {
    const { recipientAddress, ipfsCID, metadata, identityProof } = req.body;

    if (!recipientAddress || !ipfsCID || !metadata) {
      return res.status(400).json({ success: false, error: 'Missing required fields: recipientAddress, ipfsCID, metadata' });
    }

    console.log(`Minting NFT for: ${recipientAddress}`);

    // Get user verification data if available
    const userVerification = verificationService.getUserVerification(recipientAddress);
    let verificationData = {
      verified: false,
      verificationId: 'none',
      demographics: {}
    };

    if (userVerification.success && userVerification.user.isVerified) {
      verificationData = {
        verified: true,
        verificationId: userVerification.user.verificationId,
        demographics: userVerification.user.demographics
      };
      console.log(`✅ Minting for verified user with demographics:`, verificationData.demographics);
    }

    const nftMetadata = {
      ipfsCID,
      title: metadata.title || 'Audio NFT',
      artist: metadata.artist || 'Unknown',
      createdAt: new Date().toISOString(),
      identityVerified: verificationData.verified.toString(),
      verificationId: verificationData.verificationId,
      // Add demographic data to NFT metadata for dataset filtering
      gender: verificationData.demographics.gender || 'unspecified',
      ageRange: verificationData.demographics.ageRange || 'unspecified',
      region: verificationData.demographics.region || 'unspecified',
      state: verificationData.demographics.state || 'unspecified',
      accent: verificationData.demographics.accent || 'unspecified',
      primaryLanguage: verificationData.demographics.primaryLanguage || 'unspecified',
      ...metadata
    };

    const mintResult = await mintAudioNFT(recipientAddress, ipfsCID, nftMetadata);

    if (!mintResult.status || mintResult.status !== 4) { // Flow tx sealed status = 4
      return res.status(500).json({
        success: false,
        error: 'Failed to mint NFT on Flow blockchain',
        details: mintResult
      });
    }

    res.json({
      success: true,
      message: 'Audio NFT minted successfully',
      data: {
        transactionId: mintResult.id || null,
        recipientAddress,
        ipfsCID,
        metadata: nftMetadata,
        verificationStatus: verificationData.verified ? 'verified' : 'unverified'
      }
    });

  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during minting',
      details: error.message
    });
  }
});

/**
 * GET /api/nft/user/:address
 * Get all NFTs owned by a user
 */
app.get('/api/nft/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    console.log(`Getting NFTs for user: ${address}`);

    // Note: This would need to be implemented in your flow-service.js
    // For now, return placeholder
    const nftIds = []; // await flowService.getUserNFTIds(address);

    res.json({
      success: true,
      data: {
        userAddress: address,
        nftIds,
        totalCount: nftIds.length
      }
    });

  } catch (error) {
    console.error('Get user NFTs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user NFTs',
      details: error.message
    });
  }
});

/**
 * GET /api/nft/:address/:id
 * Get specific NFT details
 */
app.get('/api/nft/:address/:id', async (req, res) => {
  try {
    const { address, id } = req.params;

    console.log(`Getting NFT details: ${address}/${id}`);

    // Note: This would need to be implemented in your flow-service.js
    // For now, return placeholder
    const nftDetails = null; // await flowService.getAudioNFT(address, parseInt(id));

    if (!nftDetails) {
      return res.status(404).json({ success: false, error: 'NFT not found' });
    }

    res.json({ success: true, data: nftDetails });

  } catch (error) {
    console.error('Get NFT details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve NFT details',
      details: error.message
    });
  }
});

// =============================================
// DATASET ENDPOINTS (Bonus for Voice Marketplace)
// =============================================

/**
 * POST /api/dataset/create
 * Create voice dataset based on demographic filters
 */
app.post('/api/dataset/create', async (req, res) => {
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SonicIPChain Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Verification: http://localhost:${PORT}/api/verification/initiate`);
  console.log(`🎵 Audio upload: http://localhost:${PORT}/api/audio/upload`);
  console.log(`💎 NFT minting: http://localhost:${PORT}/api/nft/mint`);
});

export default app;
