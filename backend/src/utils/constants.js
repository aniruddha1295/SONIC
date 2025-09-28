/**
 * Application constants
 */

export const FILE_LIMITS = {
  AUDIO_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
};

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/webm'
];

export const SUPPORTED_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf'
];

export const FLOW_TRANSACTION_STATUS = {
  UNKNOWN: 0,
  PENDING: 1,
  FINALIZED: 2,
  EXECUTED: 3,
  SEALED: 4,
  EXPIRED: 5
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

export const API_ROUTES = {
  HEALTH: '/health',
  AUDIO: {
    BASE: '/api/audio',
    UPLOAD: '/upload',
    MINT: '/mint',
    UPLOAD_AND_MINT: '/upload-and-mint'
  },
  VERIFICATION: {
    BASE: '/api/verification',
    INITIATE: '/initiate',
    USER: '/user/:address',
    FILTER: '/filter',
    STATS: '/stats',
    DATASET: '/dataset/create'
  },
  NFT: {
    BASE: '/api/nft',
    USER: '/user/:address',
    DETAILS: '/:address/:id'
  }
};

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_FLOW_ADDRESS: 'Invalid Flow address format',
  VERIFICATION_FAILED: 'Verification process failed',
  UPLOAD_FAILED: 'File upload failed',
  MINT_FAILED: 'NFT minting failed',
  USER_NOT_FOUND: 'User not found',
  NFT_NOT_FOUND: 'NFT not found',
  INTERNAL_SERVER_ERROR: 'Internal server error'
};
