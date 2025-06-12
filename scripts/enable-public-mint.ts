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

    if (currentEnabled) {
      console.log(`\n✅ Public minting is already enabled!`);
      return;
    }

    // Get parameters from environment or use defaults
    const price = process.env.PUBLIC_MINT_PRICE || '0.01';
    const maxPerAddress = process.env.MAX_MINTS_PER_ADDRESS || '10';

    console.log(`\n⚙️  Enabling public mint with settings:`);
    console.log(`- Price: ${price} HYPE per NFT`);
    console.log(`- Max per address: ${maxPerAddress}`);

    // Enable public mint
    const priceInWei = ethers.parseEther(price);
    const tx = await contract.setPublicMintSettings(true, priceInWei, maxPerAddress);
    
    console.log(`\n⏳ Transaction submitted: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    
    console.log(`\n✅ Public minting enabled successfully!`);
    console.log(`🔗 Transaction: ${tx.hash}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);
    
    // Verify the change
    const newEnabled = await contract.publicMintEnabled();
    const newPrice = await contract.publicMintPrice();
    const newMaxPerAddress = await contract.maxMintsPerAddress();

    console.log(`\n📊 Updated Public Mint Settings:`);
    console.log(`- Enabled: ${newEnabled ? 'Yes' : 'No'}`);
    console.log(`- Price: ${ethers.formatEther(newPrice)} HYPE`);
    console.log(`- Max per address: ${newMaxPerAddress}`);

  } catch (error: any) {
    console.error("❌ Failed to enable public mint:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("\n🔧 Error: You are not the contract owner. Only the contract owner can enable public minting.");
    } else if (error.message.includes("nonce too high")) {
      console.log("\n🔧 Error: Nonce issue. Try resetting your MetaMask account.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n🔧 Error: Insufficient funds for gas. Make sure you have HYPE tokens.");
    }
    
    console.log("\n💡 Usage:");
    console.log("  npm run enable-public-mint                    # Enable for latest deployment");
    console.log("  npm run enable-public-mint 0xContractAddress  # Enable for specific contract");
    console.log("\n💡 Environment variables:");
    console.log("  PUBLIC_MINT_PRICE=0.01                        # Price in HYPE");
    console.log("  MAX_MINTS_PER_ADDRESS=10                      # Max mints per address");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 