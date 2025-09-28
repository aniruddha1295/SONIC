import express from 'express';
import multer from 'multer';
import LighthouseService from '../services/lighthouse-service.js';
import VerificationService from '../services/VerificationServices.js';
import { mintAudioNFT } from '../services/flow-service.js';

const router = express.Router();

// Initialize services
const lighthouseService = new LighthouseService();
const verificationService = new VerificationService();

// Configure multer for memory storage and 50MB file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio' && !file.mimetype.startsWith('audio/')) {
      cb(new Error('Only audio files are allowed for audio upload'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * POST /upload
 * Upload and encrypt audio, store on IPFS via Lighthouse
 */
router.post('/upload', upload.single('audio'), async (req, res) => {
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

/**
 * POST /mint
 * Mint Audio NFT on Flow blockchain with verification data
 */
router.post('/mint', async (req, res) => {
  try {
    const { recipientAddress, ipfsCID, metadata, identityProof } = req.body;

    if (!recipientAddress || !ipfsCID || !metadata) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: recipientAddress, ipfsCID, metadata' 
      });
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
 * POST /upload-and-mint
 * Combined endpoint for upload and mint in one operation
 */
router.post('/upload-and-mint', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    const { buffer, originalname } = req.file;
    const { userAddress, metadata } = req.body;

    if (!userAddress) {
      return res.status(400).json({ success: false, error: 'User address is required' });
    }

    // Parse metadata if it's a string
    let parsedMetadata = {};
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid metadata format' });
      }
    } else {
      parsedMetadata = metadata || {};
    }

    console.log(`Processing upload and mint for: ${userAddress}`);

    // Step 1: Upload to IPFS
    const uploadResult = await lighthouseService.processAndUploadAudio(buffer, originalname);

    if (!uploadResult.ipfsCID) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload audio to IPFS'
      });
    }

    // Step 2: Mint NFT
    const userVerification = verificationService.getUserVerification(userAddress);
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
    }

    const nftMetadata = {
      ipfsCID: uploadResult.ipfsCID,
      title: parsedMetadata.title || originalname,
      artist: parsedMetadata.artist || 'Unknown',
      createdAt: new Date().toISOString(),
      identityVerified: verificationData.verified.toString(),
      verificationId: verificationData.verificationId,
      gender: verificationData.demographics.gender || 'unspecified',
      ageRange: verificationData.demographics.ageRange || 'unspecified',
      region: verificationData.demographics.region || 'unspecified',
      state: verificationData.demographics.state || 'unspecified',
      accent: verificationData.demographics.accent || 'unspecified',
      primaryLanguage: verificationData.demographics.primaryLanguage || 'unspecified',
      ...parsedMetadata
    };

    const mintResult = await mintAudioNFT(userAddress, uploadResult.ipfsCID, nftMetadata);

    res.json({
      success: true,
      message: 'Audio uploaded and NFT minted successfully',
      data: {
        upload: {
          ipfsCID: uploadResult.ipfsCID,
          encryptionKey: uploadResult.encryptionKey,
          fileName: originalname,
          fileSize: buffer.length,
          gatewayUrl: uploadResult.gatewayURL
        },
        nft: {
          transactionId: mintResult.id || null,
          recipientAddress: userAddress,
          metadata: nftMetadata,
          verificationStatus: verificationData.verified ? 'verified' : 'unverified'
        }
      }
    });

  } catch (error) {
    console.error('Upload and mint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during upload and mint',
      details: error.message
    });
  }
});

export default router;
