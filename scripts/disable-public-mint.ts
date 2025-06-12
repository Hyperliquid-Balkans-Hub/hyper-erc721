import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentInfo {
  contractAddress: string;
  collectionName: string;
  collectionSymbol: string;
}

function getLatestDeployment(): DeploymentInfo {
  const historyDir = path.join(process.cwd(), 'deployment_history');
  
  if (!fs.existsSync(historyDir)) {
    throw new Error('No deployment history found. Please deploy a contract first.');
  }

  const files = fs.readdirSync(historyDir)
    .filter(file => file.endsWith('.md') && !file.includes('README') && !file.includes('example'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No deployment records found. Please deploy a contract first.');
  }

  const latestFile = files[0];
  const filePath = path.join(historyDir, latestFile);
  const content = fs.readFileSync(filePath, 'utf8');

  const contractAddressMatch = content.match(/\*\*Contract Address:\*\* `([^`]+)`/);
  const collectionNameMatch = content.match(/\*\*Collection Name:\*\* ([^\n]+)/);
  const collectionSymbolMatch = content.match(/\*\*Collection Symbol:\*\* ([^\n]+)/);

  if (!contractAddressMatch || !collectionNameMatch || !collectionSymbolMatch) {
    throw new Error(`Could not parse deployment information from ${latestFile}`);
  }

  return {
    contractAddress: contractAddressMatch[1],
    collectionName: collectionNameMatch[1],
    collectionSymbol: collectionSymbolMatch[1]
  };
}

async function main() {
  try {
    // Get contract address from command line args or latest deployment
    const contractAddress = process.argv[2];
    let deployment: DeploymentInfo;

    if (contractAddress) {
      console.log(`🎯 Using specified contract address: ${contractAddress}`);
      deployment = {
        contractAddress,
        collectionName: 'Unknown Collection',
        collectionSymbol: 'UNKNOWN'
      };
    } else {
      deployment = getLatestDeployment();
      console.log(`📁 Using latest deployment: ${deployment.collectionName} (${deployment.collectionSymbol})`);
    }

    console.log(`📍 Contract Address: ${deployment.contractAddress}`);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`👤 Using signer: ${signer.address}`);

    // Connect to contract
    const contract = await ethers.getContractAt('HyperERC721', deployment.contractAddress);

    // Check current public mint status
    const currentEnabled = await contract.publicMintEnabled();
    const currentPrice = await contract.publicMintPrice();
    const currentMaxPerAddress = await contract.maxMintsPerAddress();

    console.log(`\n📊 Current Public Mint Settings:`);
    console.log(`- Enabled: ${currentEnabled ? 'Yes' : 'No'}`);
    console.log(`- Price: ${ethers.formatEther(currentPrice)} HYPE`);
    console.log(`- Max per address: ${currentMaxPerAddress}`);

    if (!currentEnabled) {
      console.log(`\n✅ Public minting is already disabled!`);
      return;
    }

    console.log(`\n⚙️  Disabling public mint...`);

    // Disable public mint (keep current price and max per address)
    const tx = await contract.setPublicMintSettings(false, currentPrice, currentMaxPerAddress);
    
    console.log(`\n⏳ Transaction submitted: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    
    console.log(`\n✅ Public minting disabled successfully!`);
    console.log(`🔗 Transaction: ${tx.hash}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);
    
    // Verify the change
    const newEnabled = await contract.publicMintEnabled();

    console.log(`\n📊 Updated Public Mint Settings:`);
    console.log(`- Enabled: ${newEnabled ? 'Yes' : 'No'}`);
    console.log(`- Price: ${ethers.formatEther(currentPrice)} HYPE (unchanged)`);
    console.log(`- Max per address: ${currentMaxPerAddress} (unchanged)`);

  } catch (error: any) {
    console.error("❌ Failed to disable public mint:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("\n🔧 Error: You are not the contract owner. Only the contract owner can disable public minting.");
    } else if (error.message.includes("nonce too high")) {
      console.log("\n🔧 Error: Nonce issue. Try resetting your MetaMask account.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n🔧 Error: Insufficient funds for gas. Make sure you have HYPE tokens.");
    }
    
    console.log("\n💡 Usage:");
    console.log("  npm run disable-public-mint                    # Disable for latest deployment");
    console.log("  npm run disable-public-mint 0xContractAddress  # Disable for specific contract");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 