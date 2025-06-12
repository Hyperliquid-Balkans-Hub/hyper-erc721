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
    // Get parameters from command line args
    const contractAddress = process.argv[2];
    const action = process.argv[3]; // 'baseuri' or 'extension'
    const value = process.argv[4];

    if (!action) {
      console.log("❌ Please specify an action: 'baseuri' or 'extension'");
      console.log("\n💡 Usage:");
      console.log("  npm run update-metadata baseuri https://new-api.com/metadata/");
      console.log("  npm run update-metadata extension false");
      console.log("  npm run update-metadata 0xContractAddress baseuri https://new-api.com/metadata/");
      console.log("  npm run update-metadata 0xContractAddress extension true");
      return;
    }

    if (!value) {
      console.log("❌ Please provide a value for the action");
      console.log("\n💡 Examples:");
      console.log("  npm run update-metadata baseuri https://new-api.com/metadata/");
      console.log("  npm run update-metadata extension false");
      return;
    }

    let deployment: DeploymentInfo;

    if (contractAddress && contractAddress.startsWith('0x')) {
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
    console.log(`⚙️  Action: ${action}`);
    console.log(`📝 Value: ${value}`);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`👤 Using signer: ${signer.address}`);

    // Connect to contract
    const contract = await ethers.getContractAt('HyperERC721', deployment.contractAddress);

    if (action === 'baseuri') {
      // Update base URI
      console.log(`\n📊 Current Base URI: Will be updated to ${value}`);

      console.log(`\n⏳ Updating base URI...`);
      const tx = await contract.setBaseURI(value);
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`\n✅ Base URI updated successfully!`);
      console.log(`🔗 Transaction: ${tx.hash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);

      // Show example token URI
      const totalMinted = await contract.totalMinted();
      if (totalMinted > 0) {
        const useJsonExtension = await contract.useJsonExtension();
        const exampleTokenId = 1;
        const exampleURI = await contract.tokenURI(exampleTokenId);
        console.log(`\n🔗 Example Token URI (ID ${exampleTokenId}): ${exampleURI}`);
        console.log(`📄 JSON Extension: ${useJsonExtension ? 'Enabled' : 'Disabled'}`);
      }

    } else if (action === 'extension') {
      // Update JSON extension setting
      const useExtension = value.toLowerCase() === 'true';
      const currentExtension = await contract.useJsonExtension();
      
      console.log(`\n📊 Current JSON Extension: ${currentExtension ? 'Enabled' : 'Disabled'}`);
      console.log(`🔄 New JSON Extension: ${useExtension ? 'Enabled' : 'Disabled'}`);

      if (currentExtension === useExtension) {
        console.log(`\n✅ JSON extension is already ${useExtension ? 'enabled' : 'disabled'}!`);
        return;
      }

      console.log(`\n⏳ Updating JSON extension setting...`);
      const tx = await contract.setJsonExtension(useExtension);
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`\n✅ JSON extension setting updated successfully!`);
      console.log(`🔗 Transaction: ${tx.hash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);

      // Verify the change
      const newExtension = await contract.useJsonExtension();
      console.log(`\n📊 Updated JSON Extension: ${newExtension ? 'Enabled' : 'Disabled'}`);

      // Show example token URI
      const totalMinted = await contract.totalMinted();
      if (totalMinted > 0) {
        const exampleTokenId = 1;
        const exampleURI = await contract.tokenURI(exampleTokenId);
        console.log(`\n🔗 Example Token URI (ID ${exampleTokenId}): ${exampleURI}`);
      }

    } else {
      throw new Error('Invalid action. Use "baseuri" or "extension"');
    }

  } catch (error: any) {
    console.error("❌ Failed to update metadata:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("\n🔧 Error: You are not the contract owner. Only the contract owner can update metadata.");
    } else if (error.message.includes("nonce too high")) {
      console.log("\n🔧 Error: Nonce issue. Try resetting your MetaMask account.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n🔧 Error: Insufficient funds for gas. Make sure you have HYPE tokens.");
    }
    
    console.log("\n💡 Usage:");
    console.log("  npm run update-metadata baseuri https://new-api.com/metadata/");
    console.log("  npm run update-metadata extension false");
    console.log("  npm run update-metadata 0xContractAddress baseuri https://new-api.com/metadata/");
    console.log("  npm run update-metadata 0xContractAddress extension true");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 