import multer from 'multer';
import { FILE_LIMITS, SUPPORTED_AUDIO_TYPES, SUPPORTED_DOCUMENT_TYPES } from '../utils/constants.js';

/**
 * Multer configuration for audio file uploads
 */
export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: FILE_LIMITS.AUDIO_MAX_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio' && !SUPPORTED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(new Error('Only audio files are allowed for audio upload'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * Multer configuration for document uploads (verification)
 */
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: FILE_LIMITS.DOCUMENT_MAX_SIZE,
    files: 5 // Allow multiple documents
  },
  fileFilter: (req, file, cb) => {
    const isAudioForVoice = file.fieldname === 'voiceSample' && SUPPORTED_AUDIO_TYPES.includes(file.mimetype);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(file.mimetype);
    
    if (!isAudioForVoice && !isDocument) {
      cb(new Error('Only images, PDFs, and audio files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * Multer configuration for mixed uploads (audio + documents)
 */
export const mixedUpload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: FILE_LIMITS.AUDIO_MAX_SIZE, // Use larger limit for mixed uploads
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const isAudio = SUPPORTED_AUDIO_TYPES.includes(file.mimetype);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(file.mimetype);
    
    if (!isAudio && !isDocument) {
      cb(new Error('Only audio files, images, and PDFs are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});
