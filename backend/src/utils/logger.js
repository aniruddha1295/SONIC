/**
 * Logger utility for consistent logging across the application
 */

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  error(message, data = null) {
    console.error(this.formatMessage(LogLevel.ERROR, message, data));
  }

  warn(message, data = null) {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  info(message, data = null) {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  // Specific logging methods for different operations
  uploadStart(filename, userAddress) {
    this.info(`🎵 Audio upload started`, { filename, userAddress });
  }

  uploadSuccess(filename, ipfsCID) {
    this.info(`✅ Audio upload successful`, { filename, ipfsCID });
  }

  uploadError(filename, error) {
    this.error(`❌ Audio upload failed`, { filename, error: error.message });
  }

  mintStart(userAddress, ipfsCID) {
    this.info(`💎 NFT minting started`, { userAddress, ipfsCID });
  }

  mintSuccess(userAddress, transactionId) {
    this.info(`✅ NFT minting successful`, { userAddress, transactionId });
  }

  mintError(userAddress, error) {
    this.error(`❌ NFT minting failed`, { userAddress, error: error.message });
  }

  verificationStart(userAddress) {
    this.info(`🔍 Verification started`, { userAddress });
  }

  verificationSuccess(userAddress, verificationId) {
    this.info(`✅ Verification successful`, { userAddress, verificationId });
  }

  verificationError(userAddress, error) {
    this.error(`❌ Verification failed`, { userAddress, error: error.message });
  }
}

export default new Logger();
