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

    // Connect to contract
    const contract = await ethers.getContractAt('HyperERC721', deployment.contractAddress);

    // Get basic contract info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    const maxSupply = await contract.maxSupply();
    const totalMinted = await contract.totalMinted();
    const nextTokenId = await contract.nextTokenId();

    console.log(`\n📋 Basic Information:`);
    console.log(`- Name: ${name}`);
    console.log(`- Symbol: ${symbol}`);
    console.log(`- Owner: ${owner}`);
    console.log(`- Max Supply: ${maxSupply.toLocaleString()}`);
    console.log(`- Total Minted: ${totalMinted.toLocaleString()}`);
    console.log(`- Next Token ID: ${nextTokenId}`);
    console.log(`- Remaining: ${(maxSupply - totalMinted).toLocaleString()}`);

    // Get metadata info
    const useJsonExtension = await contract.useJsonExtension();

    console.log(`\n📄 Metadata Settings:`);
    console.log(`- JSON Extension: ${useJsonExtension ? 'Enabled' : 'Disabled'}`);

    if (totalMinted > 0) {
      const exampleTokenId = 1;
      const exampleURI = await contract.tokenURI(exampleTokenId);
      console.log(`- Example Token URI (ID ${exampleTokenId}): ${exampleURI}`);
    }

    // Get public mint info
    const publicMintEnabled = await contract.publicMintEnabled();
    const publicMintPrice = await contract.publicMintPrice();
    const maxMintsPerAddress = await contract.maxMintsPerAddress();

    console.log(`\n🎯 Public Mint Settings:`);
    console.log(`- Enabled: ${publicMintEnabled ? 'Yes' : 'No'}`);
    console.log(`- Price: ${ethers.formatEther(publicMintPrice)} HYPE per NFT`);
    console.log(`- Max per address: ${maxMintsPerAddress}`);

    // Get royalty info
    const royaltyRecipient = await contract.royaltyRecipient();
    const royaltyFeeBps = await contract.royaltyFeeBps();
    const royaltyPercentage = Number(royaltyFeeBps) / 100;

    console.log(`\n💰 Royalty Settings:`);
    console.log(`- Recipient: ${royaltyRecipient}`);
    console.log(`- Fee: ${royaltyPercentage}% (${royaltyFeeBps} basis points)`);

    // Get contract balance
    const balance = await ethers.provider.getBalance(deployment.contractAddress);
    console.log(`\n💎 Contract Balance: ${ethers.formatEther(balance)} HYPE`);

    // Get pause status
    const paused = await contract.paused();
    console.log(`\n⏸️  Contract Status: ${paused ? 'Paused' : 'Active'}`);

    // Show recent mints (if any)
    if (totalMinted > 0) {
      console.log(`\n🎨 Recent Token IDs:`);
      const recentTokens = Math.min(Number(totalMinted), 10);
      for (let i = 1; i <= recentTokens; i++) {
        try {
          const tokenOwner = await contract.ownerOf(i);
          console.log(`- Token ${i}: ${tokenOwner}`);
        } catch (error) {
          console.log(`- Token ${i}: Error getting owner`);
        }
      }
      
      if (Number(totalMinted) > 10) {
        console.log(`- ... and ${Number(totalMinted) - 10} more tokens`);
      }
    }

    // Show contract links
    console.log(`\n🔗 Contract Links:`);
    console.log(`- Purrsec: https://purrsec.com/address/${deployment.contractAddress}/transactions`);
    console.log(`- Sourcify: https://sourcify.parsec.finance/#/lookup/${deployment.contractAddress}`);

    // Show useful commands
    console.log(`\n💡 Useful Commands:`);
    console.log(`- Enable public mint: npm run enable-public-mint ${deployment.contractAddress}`);
    console.log(`- Disable public mint: npm run disable-public-mint ${deployment.contractAddress}`);
    console.log(`- Mint NFTs: npm run mint-nfts ${deployment.contractAddress} owner 5`);
    console.log(`- Update base URI: npm run update-metadata ${deployment.contractAddress} baseuri https://new-api.com/metadata/`);
    console.log(`- Toggle JSON extension: npm run update-metadata ${deployment.contractAddress} extension false`);
    console.log(`- Withdraw funds: npm run withdraw ${deployment.contractAddress}`);

  } catch (error: any) {
    console.error("❌ Failed to get contract info:", error.message);
    
    if (error.message.includes("contract not found")) {
      console.log("\n🔧 Error: Contract not found at the specified address.");
    } else if (error.message.includes("network")) {
      console.log("\n🔧 Error: Network connection issue. Check your RPC URL.");
    }
    
    console.log("\n💡 Usage:");
    console.log("  npm run contract-info                    # Info for latest deployment");
    console.log("  npm run contract-info 0xContractAddress  # Info for specific contract");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 