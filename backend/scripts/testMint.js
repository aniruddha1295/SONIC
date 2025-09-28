import dotenv from 'dotenv';
import { mintAudioNFT } from './flow-service.js';

dotenv.config();

async function main() {
  const recipient = '0x7a8ecfd516b9c18d'; // replace with actual receiver address
  const ipfsCID = 'QmExampleCIDForEncryptedAudioFile';
  const metadata = {
    title: 'My Audio NFT',
    artist: 'Creator Name',
    description: 'Audio tokenized and stored on IPFS via Lighthouse'
  };

  try {
    const result = await mintAudioNFT(recipient, ipfsCID, metadata);
    console.log('Mint Result:', result);
  } catch (err) {
    console.error(err);
  }
}

main();
