import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function createFlowAccount() {
  try {
    console.log('🔑 Creating Flow testnet account...');
    
    // Create Flow account
    const createResult = execSync('flow accounts create', { encoding: 'utf8' });
    console.log(createResult);
    
    console.log('✅ Flow account created successfully');
    console.log('📝 Please update your .env file with the generated private key and address');
    
  } catch (error) {
    console.error('❌ Error creating Flow account:', error.message);
  }
}

async function deployContract() {
  try {
    console.log('📜 Deploying AudioNFT contract to Flow testnet...');
    
    // Deploy to testnet
    const deployResult = execSync('flow project deploy --network=testnet', { encoding: 'utf8' });
    console.log(deployResult);
    
    console.log('✅ Contract deployed successfully');
    
  } catch (error) {
    console.error('❌ Error deploying contract:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting SonicIPChain deployment process...\n');
  
  if (!process.env.FLOW_PRIVATE_KEY) {
    await createFlowAccount();
    console.log('⚠️  Please configure your .env file and run deployment again');
    return;
  }
  
  await deployContract();
  
  console.log('\n🎉 Deployment complete!');
  console.log('📋 Next steps:');
  console.log('   1. Update FLOW_CONTRACT_ADDRESS in .env');
  console.log('   2. Start the API server: npm run start');
}

main().catch(console.error);
