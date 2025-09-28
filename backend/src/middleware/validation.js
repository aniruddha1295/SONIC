/**
 * Validation middleware for common request validation
 */

/**
 * Validate Flow address format
 */
export const validateFlowAddress = (req, res, next) => {
  const address = req.params.address || req.body.userAddress || req.body.recipientAddress;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Flow address is required'
    });
  }

  // Basic Flow address validation (starts with 0x and is 18 characters)
  const flowAddressRegex = /^0x[a-fA-F0-9]{16}$/;
  if (!flowAddressRegex.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Flow address format'
    });
  }

  next();
};

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Validate file upload requirements
 */
export const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  next();
};
