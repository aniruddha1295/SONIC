class VerifiedUser {
  constructor(userData) {
    this.userAddress = userData.userAddress;
    this.verificationId = userData.verificationId || null;
    this.isVerified = userData.isVerified || false;
    this.demographics = {
      age: userData.age || null,
      ageRange: userData.ageRange || null, // "21-25", "26-30", etc.
      gender: userData.gender || null,
      region: userData.region || null,
      state: userData.state || null,
      country: userData.country || "India",
      primaryLanguage: userData.primaryLanguage || null,
      accent: userData.accent || null,
      education: userData.education || null
    };
    this.documents = {
      aadhaar: userData.aadhaar || null,
      pan: userData.pan || null,
      passport: userData.passport || null,
      drivingLicense: userData.drivingLicense || null
    };
    this.verificationStatus = userData.verificationStatus || 'pending'; // pending, verified, rejected
    this.verificationScore = userData.verificationScore || 0; // 0-100
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      userAddress: this.userAddress,
      verificationId: this.verificationId,
      isVerified: this.isVerified,
      demographics: this.demographics,
      verificationStatus: this.verificationStatus,
      verificationScore: this.verificationScore,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default VerifiedUser;
