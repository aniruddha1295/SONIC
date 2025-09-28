import VerifiedUser from '../models/User.js';
import DocumentProcessor from './DocumentProcessor.js';
import crypto from 'crypto';

class VerificationService {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
    this.verifiedUsers = new Map(); // In production, use database
    this.documentHashes = new Set(); // Prevent duplicate documents
  }

  // Start user verification process
  async initiateVerification(userAddress, documents) {
    try {
      console.log(`Starting verification for user: ${userAddress}`);

      // Check if user already exists
      if (this.verifiedUsers.has(userAddress)) {
        return {
          success: false,
          error: 'User already exists. Use update verification instead.'
        };
      }

      // Process documents and extract demographics
      const verificationResult = await this.processUserDocuments(documents);

      if (!verificationResult.success) {
        return verificationResult;
      }

      // Create new verified user
      const userData = {
        userAddress,
        verificationId: this.generateVerificationId(),
        ...verificationResult.demographics,
        verificationStatus: 'verified',
        verificationScore: verificationResult.score,
        isVerified: true
      };

      const verifiedUser = new VerifiedUser(userData);
      this.verifiedUsers.set(userAddress, verifiedUser);

      console.log(`✅ User verification completed: ${userAddress}`);

      return {
        success: true,
        user: verifiedUser.toJSON(),
        message: 'User verification completed successfully'
      };

    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: 'Verification process failed',
        details: error.message
      };
    }
  }

  // Process all user documents
  async processUserDocuments(documents) {
    try {
      let demographics = {};
      let score = 0;
      const processedDocs = [];

      // Process Aadhaar if provided
      if (documents.aadhaar) {
        const aadhaarResult = this.documentProcessor.processAadhaar(documents.aadhaar);
        
        if (aadhaarResult.success) {
          // Check for duplicate document
          if (this.documentHashes.has(aadhaarResult.data.documentHash)) {
            return {
              success: false,
              error: 'Aadhaar document already used by another user'
            };
          }

          this.documentHashes.add(aadhaarResult.data.documentHash);
          
          demographics.age = aadhaarResult.data.age;
          demographics.ageRange = this.documentProcessor.getAgeRange(aadhaarResult.data.age);
          demographics.gender = aadhaarResult.data.gender;
          demographics.state = aadhaarResult.data.state;
          demographics.region = this.documentProcessor.getRegion(aadhaarResult.data.state);
          score += 40;
          processedDocs.push('aadhaar');
        }
      }

      // Process PAN if provided
      if (documents.pan) {
        const panResult = this.documentProcessor.processPAN(documents.pan);
        
        if (panResult.success) {
          if (this.documentHashes.has(panResult.data.documentHash)) {
            return {
              success: false,
              error: 'PAN document already used by another user'
            };
          }

          this.documentHashes.add(panResult.data.documentHash);
          score += 30;
          processedDocs.push('pan');
        }
      }

      // Additional verification steps
      if (documents.voiceSample) {
        demographics.accent = this.detectAccent(documents.voiceSample);
        demographics.primaryLanguage = this.detectLanguage(documents.voiceSample);
        score += 20;
        processedDocs.push('voice_sample');
      }

      // Basic validation
      if (score < 40) {
        return {
          success: false,
          error: 'Insufficient documents for verification. Please provide Aadhaar or equivalent.'
        };
      }

      return {
        success: true,
        demographics,
        score,
        processedDocuments: processedDocs
      };

    } catch (error) {
      return {
        success: false,
        error: 'Document processing failed',
        details: error.message
      };
    }
  }

  // Get user verification status
  getUserVerification(userAddress) {
    const user = this.verifiedUsers.get(userAddress);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: user.toJSON()
    };
  }

  // Get users by demographic filters
  filterUsersByDemographics(filters) {
    const filteredUsers = [];

    for (const [address, user] of this.verifiedUsers) {
      if (this.matchesDemographicFilter(user, filters)) {
        filteredUsers.push({
          userAddress: address,
          demographics: user.demographics,
          verificationScore: user.verificationScore
        });
      }
    }

    return {
      success: true,
      users: filteredUsers,
      count: filteredUsers.length
    };
  }

  // Check if user matches demographic filters
  matchesDemographicFilter(user, filters) {
    if (filters.gender && user.demographics.gender !== filters.gender) return false;
    if (filters.ageRange && user.demographics.ageRange !== filters.ageRange) return false;
    if (filters.region && user.demographics.region !== filters.region) return false;
    if (filters.state && user.demographics.state !== filters.state) return false;
    if (filters.accent && user.demographics.accent !== filters.accent) return false;
    if (filters.primaryLanguage && user.demographics.primaryLanguage !== filters.primaryLanguage) return false;
    
    return true;
  }

  // Mock accent detection (replace with real ML model)
  detectAccent(voiceSample) {
    const accents = ['Indian English', 'Hindi', 'Tamil', 'Bengali', 'Marathi', 'Gujarati'];
    return accents[Math.floor(Math.random() * accents.length)];
  }

  // Mock language detection
  detectLanguage(voiceSample) {
    const languages = ['Hindi', 'English', 'Tamil', 'Bengali', 'Marathi', 'Telugu'];
    return languages[Math.floor(Math.random() * languages.length)];
  }

  // Generate unique verification ID
  generateVerificationId() {
    return 'VER_' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Get verification statistics
  getVerificationStats() {
    const totalUsers = this.verifiedUsers.size;
    let demographics = {
      gender: { Male: 0, Female: 0, Other: 0 },
      ageRanges: {},
      regions: {},
      states: {}
    };

    for (const [address, user] of this.verifiedUsers) {
      // Gender stats
      demographics.gender[user.demographics.gender] = 
        (demographics.gender[user.demographics.gender] || 0) + 1;

      // Age range stats
      demographics.ageRanges[user.demographics.ageRange] = 
        (demographics.ageRanges[user.demographics.ageRange] || 0) + 1;

      // Region stats
      demographics.regions[user.demographics.region] = 
        (demographics.regions[user.demographics.region] || 0) + 1;

      // State stats
      demographics.states[user.demographics.state] = 
        (demographics.states[user.demographics.state] || 0) + 1;
    }

    return {
      totalVerifiedUsers: totalUsers,
      demographics
    };
  }
}

export default VerificationService;
