/**
 * Helper utility functions
 */

/**
 * Generate unique ID with prefix
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
};

/**
 * Validate Flow address format
 */
export const isValidFlowAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  const flowAddressRegex = /^0x[a-fA-F0-9]{16}$/;
  return flowAddressRegex.test(address);
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Sanitize filename for safe storage
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Create standardized API response
 */
export const createResponse = (success, message, data = null, error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data) response.data = data;
  if (error) response.error = error;
  
  return response;
};

/**
 * Create success response
 */
export const successResponse = (message, data = null) => {
  return createResponse(true, message, data);
};

/**
 * Create error response
 */
export const errorResponse = (message, error = null) => {
  return createResponse(false, message, null, error);
};

/**
 * Validate required fields in object
 */
export const validateRequiredFields = (obj, requiredFields) => {
  const missing = requiredFields.filter(field => !obj[field]);
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if string is valid JSON
 */
export const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Parse JSON safely
 */
export const safeJSONParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Generate verification ID
 */
export const generateVerificationId = () => {
  return generateId('VER_');
};

/**
 * Generate dataset ID
 */
export const generateDatasetId = () => {
  return generateId('DS_');
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data) => {
  const masked = { ...data };
  
  // Mask private keys, addresses (show only first and last 4 chars)
  if (masked.privateKey) {
    masked.privateKey = '***MASKED***';
  }
  
  if (masked.address && masked.address.length > 8) {
    masked.address = `${masked.address.slice(0, 4)}...${masked.address.slice(-4)}`;
  }
  
  if (masked.encryptionKey) {
    masked.encryptionKey = '***MASKED***';
  }
  
  return masked;
};
