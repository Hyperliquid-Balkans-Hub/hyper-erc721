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

    // Check if signer is the owner
    const owner = await contract.owner();
    if (signer.address !== owner) {
      throw new Error(`You are not the contract owner. Owner is: ${owner}`);
    }

    // Check contract balance
    const balance = await ethers.provider.getBalance(deployment.contractAddress);
    console.log(`\n💎 Contract Balance: ${ethers.formatEther(balance)} HYPE`);

    if (balance === 0n) {
      console.log(`\n✅ Contract has no funds to withdraw!`);
      return;
    }

    // Get signer's balance before withdrawal
    const signerBalanceBefore = await ethers.provider.getBalance(signer.address);
    console.log(`👤 Your balance before: ${ethers.formatEther(signerBalanceBefore)} HYPE`);

    console.log(`\n⏳ Withdrawing ${ethers.formatEther(balance)} HYPE...`);
    const tx = await contract.withdraw();
    
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    
    console.log(`\n✅ Withdrawal successful!`);
    console.log(`🔗 Transaction: ${tx.hash}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);

    // Get signer's balance after withdrawal
    const signerBalanceAfter = await ethers.provider.getBalance(signer.address);
    const newContractBalance = await ethers.provider.getBalance(deployment.contractAddress);
    
    console.log(`\n📊 Balance Update:`);
    console.log(`- Contract balance: ${ethers.formatEther(newContractBalance)} HYPE`);
    console.log(`- Your balance: ${ethers.formatEther(signerBalanceAfter)} HYPE`);
    
    // Calculate actual received amount (accounting for gas fees)
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const actualReceived = balance - BigInt(gasCost);
    console.log(`- Amount received: ${ethers.formatEther(actualReceived)} HYPE`);
    console.log(`- Gas cost: ${ethers.formatEther(gasCost)} HYPE`);

  } catch (error: any) {
    console.error("❌ Failed to withdraw funds:", error.message);
    
    if (error.message.includes("You are not the contract owner")) {
      console.log("\n🔧 Error: Only the contract owner can withdraw funds.");
    } else if (error.message.includes("No funds to withdraw")) {
      console.log("\n🔧 Error: Contract has no funds to withdraw.");
    } else if (error.message.includes("nonce too high")) {
      console.log("\n🔧 Error: Nonce issue. Try resetting your MetaMask account.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n🔧 Error: Insufficient funds for gas. Make sure you have HYPE tokens.");
    }
    
    console.log("\n💡 Usage:");
    console.log("  npm run withdraw                    # Withdraw from latest deployment");
    console.log("  npm run withdraw 0xContractAddress  # Withdraw from specific contract");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 