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
    const mintType = process.argv[3] || 'owner'; // 'owner' or 'public'
    const quantity = parseInt(process.argv[4]) || 1;
    const recipient = process.argv[5]; // Only for owner minting

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
    console.log(`🎨 Mint Type: ${mintType}`);
    console.log(`🔢 Quantity: ${quantity}`);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`👤 Using signer: ${signer.address}`);

    // Connect to contract
    const contract = await ethers.getContractAt('HyperERC721', deployment.contractAddress);

    // Check contract state
    const totalMinted = await contract.totalMinted();
    const maxSupply = await contract.maxSupply();
    const nextTokenId = await contract.nextTokenId();

    console.log(`\n📊 Contract State:`);
    console.log(`- Total Minted: ${totalMinted}/${maxSupply}`);
    console.log(`- Next Token ID: ${nextTokenId}`);

    if (mintType === 'owner') {
      // Owner minting
      const mintTo = recipient || signer.address;
      console.log(`🎯 Minting to: ${mintTo}`);

      if (totalMinted + quantity > maxSupply) {
        throw new Error(`Cannot mint ${quantity} NFTs. Would exceed max supply of ${maxSupply}`);
      }

      console.log(`\n⏳ Minting ${quantity} NFTs...`);
      const tx = await contract.mint(mintTo, quantity);
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`\n✅ Successfully minted ${quantity} NFTs to ${mintTo}!`);
      console.log(`🔗 Transaction: ${tx.hash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);

      // Show minted token IDs
      const newTotalMinted = await contract.totalMinted();
      console.log(`\n🎨 Minted Token IDs: ${nextTokenId} to ${nextTokenId + quantity - 1}`);
      console.log(`📊 New Total Minted: ${newTotalMinted}/${maxSupply}`);

    } else if (mintType === 'public') {
      // Public minting
      const publicMintEnabled = await contract.publicMintEnabled();
      const publicMintPrice = await contract.publicMintPrice();
      const maxMintsPerAddress = await contract.maxMintsPerAddress();
      const currentMints = await contract.mintsPerAddress(signer.address);

      console.log(`\n📊 Public Mint Settings:`);
      console.log(`- Enabled: ${publicMintEnabled ? 'Yes' : 'No'}`);
      console.log(`- Price: ${ethers.formatEther(publicMintPrice)} HYPE per NFT`);
      console.log(`- Max per address: ${maxMintsPerAddress}`);
      console.log(`- Your mints: ${currentMints}/${maxMintsPerAddress}`);

      if (!publicMintEnabled) {
        throw new Error('Public minting is not enabled');
      }

      if (currentMints + quantity > maxMintsPerAddress) {
        throw new Error(`Cannot mint ${quantity} NFTs. Would exceed max mints per address (${maxMintsPerAddress})`);
      }

      if (totalMinted + quantity > maxSupply) {
        throw new Error(`Cannot mint ${quantity} NFTs. Would exceed max supply of ${maxSupply}`);
      }

      const totalCost = publicMintPrice * BigInt(quantity);
      console.log(`\n💰 Total cost: ${ethers.formatEther(totalCost)} HYPE`);

      console.log(`\n⏳ Minting ${quantity} NFTs via public mint...`);
      const tx = await contract.publicMint(quantity, { value: totalCost });
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`\n✅ Successfully minted ${quantity} NFTs via public mint!`);
      console.log(`🔗 Transaction: ${tx.hash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);

      // Show minted token IDs
      const newTotalMinted = await contract.totalMinted();
      const newMints = await contract.mintsPerAddress(signer.address);
      console.log(`\n🎨 Minted Token IDs: ${nextTokenId} to ${nextTokenId + quantity - 1}`);
      console.log(`📊 New Total Minted: ${newTotalMinted}/${maxSupply}`);
      console.log(`📊 Your Total Mints: ${newMints}/${maxMintsPerAddress}`);

    } else {
      throw new Error('Invalid mint type. Use "owner" or "public"');
    }

  } catch (error: any) {
    console.error("❌ Failed to mint NFTs:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("\n🔧 Error: You are not the contract owner for owner minting.");
    } else if (error.message.includes("Public mint not enabled")) {
      console.log("\n🔧 Error: Public minting is not enabled. Use owner minting instead.");
    } else if (error.message.includes("Exceeds max mints per address")) {
      console.log("\n🔧 Error: You've reached the maximum mints per address limit.");
    } else if (error.message.includes("Exceeds maximum supply")) {
      console.log("\n🔧 Error: Cannot mint more NFTs. Max supply reached.");
    } else if (error.message.includes("Insufficient payment")) {
      console.log("\n🔧 Error: Insufficient payment for public minting.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n🔧 Error: Insufficient funds for gas. Make sure you have HYPE tokens.");
    }
    
    console.log("\n💡 Usage:");
    console.log("  npm run mint-nfts                                    # Owner mint 1 NFT to signer");
    console.log("  npm run mint-nfts 0xContractAddress                  # Owner mint 1 NFT to signer");
    console.log("  npm run mint-nfts 0xContractAddress owner 5          # Owner mint 5 NFTs to signer");
    console.log("  npm run mint-nfts 0xContractAddress owner 5 0xAddr   # Owner mint 5 NFTs to address");
    console.log("  npm run mint-nfts 0xContractAddress public 3         # Public mint 3 NFTs");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 