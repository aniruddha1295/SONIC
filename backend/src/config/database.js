/**
 * Database configuration
 * Currently using in-memory storage, but can be extended to use PostgreSQL or MongoDB
 */

class InMemoryDatabase {
  constructor() {
    this.users = new Map();
    this.nfts = new Map();
    this.datasets = new Map();
    this.verifications = new Map();
  }

  // User operations
  createUser(address, userData) {
    this.users.set(address, {
      address,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return this.users.get(address);
  }

  getUser(address) {
    return this.users.get(address);
  }

  updateUser(address, updates) {
    const user = this.users.get(address);
    if (user) {
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.users.set(address, updatedUser);
      return updatedUser;
    }
    return null;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  // NFT operations
  createNFT(id, nftData) {
    this.nfts.set(id, {
      id,
      ...nftData,
      createdAt: new Date().toISOString()
    });
    return this.nfts.get(id);
  }

  getNFT(id) {
    return this.nfts.get(id);
  }

  getUserNFTs(address) {
    return Array.from(this.nfts.values()).filter(nft => nft.owner === address);
  }

  // Dataset operations
  createDataset(id, datasetData) {
    this.datasets.set(id, {
      id,
      ...datasetData,
      createdAt: new Date().toISOString()
    });
    return this.datasets.get(id);
  }

  getDataset(id) {
    return this.datasets.get(id);
  }

  getAllDatasets() {
    return Array.from(this.datasets.values());
  }

  // Verification operations
  createVerification(id, verificationData) {
    this.verifications.set(id, {
      id,
      ...verificationData,
      createdAt: new Date().toISOString()
    });
    return this.verifications.get(id);
  }

  getVerification(id) {
    return this.verifications.get(id);
  }

  getVerificationByAddress(address) {
    return Array.from(this.verifications.values()).find(v => v.userAddress === address);
  }

  // Statistics
  getStats() {
    return {
      totalUsers: this.users.size,
      totalNFTs: this.nfts.size,
      totalDatasets: this.datasets.size,
      totalVerifications: this.verifications.size,
      verifiedUsers: Array.from(this.users.values()).filter(u => u.isVerified).length
    };
  }

  // Clear all data (for testing)
  clear() {
    this.users.clear();
    this.nfts.clear();
    this.datasets.clear();
    this.verifications.clear();
  }
}

// Singleton instance
const database = new InMemoryDatabase();

export default database;
