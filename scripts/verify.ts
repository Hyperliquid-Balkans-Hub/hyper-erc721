import { run } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentInfo {
  contractAddress: string;
  collectionName: string;
  collectionSymbol: string;
  maxSupply: string;
  baseURI: string;
  useJsonExtension: boolean;
  royaltyRecipient: string;
  royaltyFeeBps: string;
  contractName: string;
}

function getLatestDeployment(): DeploymentInfo {
  const historyDir = path.join(process.cwd(), 'deployment_history');
  
  if (!fs.existsSync(historyDir)) {
    throw new Error('No deployment history found. Please deploy a contract first.');
  }

  // Get all deployment files (exclude README.md and example files)
  const files = fs.readdirSync(historyDir)
    .filter(file => file.endsWith('.md') && !file.includes('README') && !file.includes('example'))
    .sort()
    .reverse(); // Get latest first

  if (files.length === 0) {
    throw new Error('No deployment records found. Please deploy a contract first.');
  }

  const latestFile = files[0];
  const filePath = path.join(historyDir, latestFile);
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`📁 Reading deployment info from: ${latestFile}`);

  // Parse the deployment information from the markdown file
  const contractAddressMatch = content.match(/\*\*Contract Address:\*\* `([^`]+)`/);
  const collectionNameMatch = content.match(/\*\*Collection Name:\*\* ([^\n]+)/);
  const collectionSymbolMatch = content.match(/\*\*Collection Symbol:\*\* ([^\n]+)/);
  const maxSupplyMatch = content.match(/\*\*Max Supply:\*\* ([0-9,]+) NFTs/);
  const baseURIMatch = content.match(/\*\*Base URI:\*\* ([^\n]+)/);
  const metadataFormatMatch = content.match(/\*\*Metadata Format:\*\* (With \.json extension|Without extension)/);
  const royaltyRecipientMatch = content.match(/\*\*Royalty Recipient:\*\* `([^`]+)`/);
  const royaltyFeeBpsMatch = content.match(/\*\*Royalty Fee:\*\* [0-9.]+% \(([0-9]+) basis points\)/);

  if (!contractAddressMatch || !collectionNameMatch || !collectionSymbolMatch || 
      !maxSupplyMatch || !baseURIMatch || !royaltyRecipientMatch || !royaltyFeeBpsMatch) {
    throw new Error(`Could not parse deployment information from ${latestFile}`);
  }

  // Parse metadata format, default to true for backward compatibility
  const useJsonExtension = metadataFormatMatch ? metadataFormatMatch[1].includes('With .json') : true;

  return {
    contractAddress: contractAddressMatch[1],
    collectionName: collectionNameMatch[1],
    collectionSymbol: collectionSymbolMatch[1],
    maxSupply: maxSupplyMatch[1].replace(/,/g, ''), // Remove commas from number
    baseURI: baseURIMatch[1],
    useJsonExtension: useJsonExtension,
    royaltyRecipient: royaltyRecipientMatch[1],
    royaltyFeeBps: royaltyFeeBpsMatch[1],
    contractName: 'HyperERC721' // We know this is always HyperERC721
  };
}

async function main() {
  try {
    // Get deployment info from latest deployment history
    const deployment = getLatestDeployment();
    
    // Constructor arguments from deployment (HyperERC721 takes: name, symbol, maxSupply, baseURI, royaltyRecipient, royaltyFeeBps, useJsonExtension)
    const constructorArgs = [
      deployment.collectionName,
      deployment.collectionSymbol,
      deployment.maxSupply,
      deployment.baseURI,
      deployment.royaltyRecipient,
      deployment.royaltyFeeBps,
      deployment.useJsonExtension
    ];

    console.log("🔍 Verifying contract on Hyperliquid HyperEVM...");
    console.log(`📍 Contract Address: ${deployment.contractAddress}`);
    console.log(`📝 Contract Name: ${deployment.contractName}`);
    console.log(`🏷️  Collection: ${deployment.collectionName} (${deployment.collectionSymbol})`);
    console.log(`🔢 Max Supply: ${Number(deployment.maxSupply).toLocaleString()}`);
    console.log(`🔗 Base URI: ${deployment.baseURI}`);
    console.log(`📄 Metadata Format: ${deployment.useJsonExtension ? 'With .json extension' : 'Without extension'}`);
    console.log(`💰 Royalty: ${Number(deployment.royaltyFeeBps) / 100}% to ${deployment.royaltyRecipient}`);
    console.log(`🔧 Constructor Args:`, constructorArgs);

    await run("verify:verify", {
      address: deployment.contractAddress,
      constructorArguments: constructorArgs,
      contract: `contracts/${deployment.contractName}.sol:${deployment.contractName}`,
    });

    console.log("✅ Contract verified successfully!");
    console.log(`🔍 View verified contract: https://sourcify.parsec.finance/#/lookup/${deployment.contractAddress}`);
    
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Make sure you have deployed a contract first");
      console.log("2. Verify the deployment history file contains correct information");
      console.log("3. Ensure you're using the correct contract name");
      console.log("4. Try running from the project root directory");
      console.log("5. You can override with env vars: CONTRACT_ADDRESS, COLLECTION_NAME, COLLECTION_SYMBOL, MAX_SUPPLY, BASE_URI, ROYALTY_RECIPIENT, ROYALTY_FEE_BPS");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 