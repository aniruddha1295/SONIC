# SONIC Backend API Documentation

## Overview

The SONIC backend provides RESTful APIs for audio tokenization, user verification, and NFT management on the Flow blockchain.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, no authentication is required. Future versions will implement JWT-based authentication.

## API Endpoints

### Health Check

#### GET /health

Check the status of the API and its services.

**Response:**
```json
{
  "success": true,
  "message": "SONIC API is running",
  "data": {
    "version": "1.0.0",
    "environment": "development",
    "services": {
      "lighthouse": "connected",
      "verification": "active",
      "flow": "connected"
    },
    "uptime": 123.456
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Audio Endpoints

### POST /api/audio/upload

Upload an audio file to IPFS via Lighthouse.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `audio` (file): Audio file (max 50MB)
  - `userAddress` (string): Flow wallet address

**Response:**
```json
{
  "success": true,
  "message": "Audio uploaded successfully",
  "data": {
    "ipfsCID": "QmXxXxXx...",
    "encryptionKey": "encrypted_key",
    "fileName": "audio.mp3",
    "fileSize": 1024000,
    "gatewayUrl": "https://gateway.lighthouse.storage/ipfs/QmXxXxXx...",
    "userAddress": "0x1234567890abcdef"
  }
}
```

### POST /api/audio/mint

Mint an Audio NFT on Flow blockchain.

**Request:**
```json
{
  "recipientAddress": "0x1234567890abcdef",
  "ipfsCID": "QmXxXxXx...",
  "metadata": {
    "title": "My Audio NFT",
    "artist": "Artist Name",
    "description": "Audio description"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audio NFT minted successfully",
  "data": {
    "transactionId": "0xabcdef...",
    "recipientAddress": "0x1234567890abcdef",
    "ipfsCID": "QmXxXxXx...",
    "metadata": {
      "title": "My Audio NFT",
      "artist": "Artist Name",
      "identityVerified": "true",
      "gender": "male",
      "ageRange": "25-35"
    },
    "verificationStatus": "verified"
  }
}
```

### POST /api/audio/upload-and-mint

Combined endpoint to upload audio and mint NFT in one operation.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `audio` (file): Audio file
  - `userAddress` (string): Flow wallet address
  - `metadata` (string): JSON string with NFT metadata

---

## Verification Endpoints

### POST /api/verification/initiate

Start user identity verification process.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `userAddress` (string): Flow wallet address
  - `aadhaar` (file): Aadhaar document image
  - `pan` (file): PAN card image
  - `voiceSample` (file): Voice sample audio

**Response:**
```json
{
  "success": true,
  "message": "User verification completed successfully",
  "data": {
    "userAddress": "0x1234567890abcdef",
    "verificationId": "VER_1234567890_abc123",
    "isVerified": true,
    "demographics": {
      "gender": "male",
      "ageRange": "25-35",
      "region": "North India",
      "state": "Delhi",
      "accent": "Hindi",
      "primaryLanguage": "Hindi"
    }
  }
}
```

### GET /api/verification/user/:address

Get user verification status.

**Response:**
```json
{
  "success": true,
  "data": {
    "userAddress": "0x1234567890abcdef",
    "isVerified": true,
    "verificationId": "VER_1234567890_abc123",
    "demographics": {
      "gender": "male",
      "ageRange": "25-35"
    }
  }
}
```

### POST /api/verification/filter

Filter users by demographic criteria.

**Request:**
```json
{
  "gender": "male",
  "ageRange": "25-35",
  "region": "North India",
  "primaryLanguage": "Hindi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Found 5 users matching criteria",
  "data": [
    {
      "userAddress": "0x1234567890abcdef",
      "demographics": {
        "gender": "male",
        "ageRange": "25-35"
      }
    }
  ],
  "filters": {
    "gender": "male",
    "ageRange": "25-35"
  }
}
```

### GET /api/verification/stats

Get verification statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "verifiedUsers": 85,
    "pendingVerifications": 10,
    "rejectedVerifications": 5,
    "demographicBreakdown": {
      "gender": {
        "male": 60,
        "female": 40
      },
      "ageRange": {
        "18-25": 30,
        "25-35": 45,
        "35-50": 25
      }
    }
  }
}
```

---

## NFT Endpoints

### GET /api/nft/user/:address

Get all NFTs owned by a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userAddress": "0x1234567890abcdef",
    "nftIds": [1, 2, 3],
    "totalCount": 3
  }
}
```

### GET /api/nft/:address/:id

Get specific NFT details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "owner": "0x1234567890abcdef",
    "ipfsCID": "QmXxXxXx...",
    "metadata": {
      "title": "My Audio NFT",
      "artist": "Artist Name",
      "identityVerified": "true"
    }
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `400` - Bad Request (missing fields, invalid data)
- `404` - Not Found (user, NFT not found)
- `413` - Payload Too Large (file size exceeded)
- `415` - Unsupported Media Type (invalid file type)
- `500` - Internal Server Error

---

## File Upload Limits

- **Audio files**: Maximum 50MB
- **Document files**: Maximum 10MB
- **Supported audio formats**: MP3, WAV, MP4, AAC, OGG, WebM
- **Supported document formats**: JPEG, PNG, PDF
