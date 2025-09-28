import lighthouse from '@lighthouse-web3/sdk';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

class LighthouseService {
  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY;
    if (!this.apiKey) {
      throw new Error('LIGHTHOUSE_API_KEY missing in environment variables');
    }
  }

  // Encrypt audio buffer using AES-256-CBC locally
  encryptAudio(audioBuffer) {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(audioBuffer), cipher.final()]);

    return {
      encryptedData: encrypted,
      encryptionKey: key.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  // Upload encrypted audio buffer to Lighthouse via SDK
  async uploadEncryptedAudio(encryptedBuffer, fileName) {
    // Write buffer to local temp file
    const tempPath = `./temp_${fileName}`;
    fs.writeFileSync(tempPath, encryptedBuffer);

    try {
      const response = await lighthouse.upload(tempPath, this.apiKey);

      fs.unlinkSync(tempPath);  // Delete temp file

      if (!response.data.Hash) {
        throw new Error('Upload failed - no IPFS hash returned');
      }

      // Return IPFS CID and gateway URL
      return {
        ipfsCID: response.data.Hash,
        gatewayURL: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`
      };

    } catch (error) {
      fs.unlinkSync(tempPath);
      throw error;
    }
  }

  // Full workflow: encrypt and upload audio file buffer
  async processAndUploadAudio(audioBuffer, fileName) {
    const encryptionResult = this.encryptAudio(audioBuffer);
    const uploadResult = await this.uploadEncryptedAudio(encryptionResult.encryptedData, fileName);

    return {
      ipfsCID: uploadResult.ipfsCID,
      gatewayURL: uploadResult.gatewayURL,
      encryptionKey: encryptionResult.encryptionKey,
      iv: encryptionResult.iv
    };
  }
}

export default LighthouseService;
