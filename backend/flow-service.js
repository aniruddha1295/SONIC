import * as fcl from '@onflow/fcl';
import dotenv from 'dotenv';
import pkg from 'elliptic';
const { ec: EC } = pkg;
import { SHA3 } from 'sha3';

dotenv.config();

const PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.FLOW_CONTRACT_ADDRESS;
const NETWORK = process.env.FLOW_NETWORK || 'testnet';

fcl.config()
  .put("accessNode.api", "https://access-testnet.onflow.org")  // testnet access node
  .put("challenge.handshake", "https://flow-wallet-testnet.blocto.app/authn"); // testnet wallet

const ec = new EC('p256');

function signWithKey(privateKey, msg){
  const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
  const sha = new SHA3(256);
  sha.update(Buffer.from(msg, 'hex'));
  const digest = sha.digest();

  const signature = key.sign(digest);
  
  const n = 32;
  const r = signature.r.toArrayLike(Buffer, 'be', n);
  const s = signature.s.toArrayLike(Buffer, 'be', n);
  
  return Buffer.concat([r, s]).toString('hex');
}

const authorization =  () => {
  return async (account) => {
    return {
      ...account,
      tempId: `${CONTRACT_ADDRESS}-key`,
      addr: CONTRACT_ADDRESS,
      keyId: 0,
      signingFunction: async (signable) => {
        return {
          addr: CONTRACT_ADDRESS,
          keyId: 0,
          signature: signWithKey(PRIVATE_KEY, signable.message)
        };
      }
    };
  };
};

async function mintAudioNFT(recipientAddress, ipfsCID, metadata) {
  const cadenceTx = `
    import AudioNFT from ${CONTRACT_ADDRESS}
    import NonFungibleToken from 0x631e88ae7f1d7c20

    transaction(recipient: Address, ipfsCID: String, metadata: {String: String}) {
      let minter: &AudioNFT.NFTMinter
      let receiverRef: &{NonFungibleToken.CollectionPublic}

      prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&AudioNFT.NFTMinter>(from: AudioNFT.MinterStoragePath)
          ?? panic("Could not borrow minter reference")
        self.receiverRef = getAccount(recipient)
          .getCapability(AudioNFT.CollectionPublicPath)
          .borrow<&{NonFungibleToken.CollectionPublic}>()
          ?? panic("Could not borrow receiver reference")
      }

      execute {
        let newNFTID = self.minter.mintNFT(recipient: self.receiverRef, ipfsCID: ipfsCID, metadata: metadata)
        log("Minted NFT ID: ".concat(newNFTID.toString()))
      }
    }
  `;
  
  try {
    const txId = await fcl.mutate({
      cadence: cadenceTx,
      args: (arg, t) => [
        arg(recipientAddress, t.Address),
        arg(ipfsCID, t.String),
        arg(
          Object.entries(metadata).map(([key, value]) => ({
            key: key,
            value: value.toString()
          })),
          t.Dictionary({ key: t.String, value: t.String })
        )
      ],
      proposer: authorization(),
      payer: authorization(),
      authorizations: [authorization()],
      limit: 100
    });
    
    console.log(`Transaction submitted: ${txId}`);

    const txStatus = await fcl.tx(txId).onceSealed();
    console.log(`Transaction sealed: ${txStatus.statusString}`);

    return txStatus;

  } catch (error) {
    console.error('Error minting AudioNFT:', error);
    throw error;
  }
}

export {
  mintAudioNFT,
};
