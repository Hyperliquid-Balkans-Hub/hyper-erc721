import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';

interface DeploymentInfo {
  contractAddress: string;
  collectionName: string;
  collectionSymbol: string;
  maxSupply: string;
  baseURI: string;
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
  const royaltyRecipientMatch = content.match(/\*\*Royalty Recipient:\*\* `([^`]+)`/);
  const royaltyFeeBpsMatch = content.match(/\*\*Royalty Fee:\*\* [0-9.]+% \(([0-9]+) basis points\)/);

  if (!contractAddressMatch || !collectionNameMatch || !collectionSymbolMatch || 
      !maxSupplyMatch || !baseURIMatch || !royaltyRecipientMatch || !royaltyFeeBpsMatch) {
    throw new Error(`Could not parse deployment information from ${latestFile}`);
  }

  return {
    contractAddress: contractAddressMatch[1],
    collectionName: collectionNameMatch[1],
    collectionSymbol: collectionSymbolMatch[1],
    maxSupply: maxSupplyMatch[1].replace(/,/g, ''), // Remove commas from number
    baseURI: baseURIMatch[1],
    royaltyRecipient: royaltyRecipientMatch[1],
    royaltyFeeBps: royaltyFeeBpsMatch[1],
    contractName: 'HyperERC721' // We know this is always HyperERC721
  };
}

async function main() {
  try {
    // Get deployment info from latest deployment history
    const deployment = getLatestDeployment();
    const chainId = "999"; // Hyperliquid HyperEVM
    
    console.log("🔍 Verifying contract with Sourcify...");
    console.log(`📍 Contract Address: ${deployment.contractAddress}`);
    console.log(`🏷️  Collection: ${deployment.collectionName} (${deployment.collectionSymbol})`);
    console.log(`🔢 Max Supply: ${Number(deployment.maxSupply).toLocaleString()}`);
    console.log(`🔗 Base URI: ${deployment.baseURI}`);
    console.log(`💰 Royalty: ${Number(deployment.royaltyFeeBps) / 100}% to ${deployment.royaltyRecipient}`);
    console.log(`🌐 Chain ID: ${chainId}`);

    // First, check if already verified
    console.log("\n📋 Checking if contract is already verified...");
    const checkUrl = `https://sourcify.parsec.finance/verify/check-by-addresses?addresses=${deployment.contractAddress}&chainIds=${chainId}`;
    
    try {
      const checkResponse = await axios.get(checkUrl);
      if (checkResponse.data && checkResponse.data[0] && checkResponse.data[0].status === "perfect") {
        console.log("✅ Contract is already verified!");
        console.log(`🔍 View verified contract: https://sourcify.parsec.finance/#/lookup/${deployment.contractAddress}`);
        return;
      }
    } catch (error) {
      console.log("📝 Contract not yet verified, proceeding with verification...");
    }

    // Read contract files
    const contractPath = path.join(process.cwd(), 'contracts', `${deployment.contractName}.sol`);
    const artifactPath = path.join(process.cwd(), 'artifacts', 'contracts', `${deployment.contractName}.sol`, `${deployment.contractName}.json`);
    const debugPath = path.join(process.cwd(), 'artifacts', 'contracts', `${deployment.contractName}.sol`, `${deployment.contractName}.dbg.json`);
    
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }
    
    if (!fs.existsSync(debugPath)) {
      throw new Error(`Debug file not found: ${debugPath}. Run 'npm run compile' first.`);
    }

    const contractSource = fs.readFileSync(contractPath, 'utf8');
    const debugInfo = JSON.parse(fs.readFileSync(debugPath, 'utf8'));
    const buildInfoPath = path.join(process.cwd(), 'artifacts', 'build-info', path.basename(debugInfo.buildInfo));
    
    if (!fs.existsSync(buildInfoPath)) {
      throw new Error(`Build info file not found: ${buildInfoPath}`);
    }
    
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
    const metadata = buildInfo.output.contracts[`contracts/${deployment.contractName}.sol`][deployment.contractName].metadata;

    // Prepare form data with source files and metadata
    const form = new FormData();
    form.append('address', deployment.contractAddress);
    form.append('chain', chainId);
    form.append('files', contractSource, `${deployment.contractName}.sol`);
    
    // Add the metadata.json file
    const metadataBuffer = Buffer.from(metadata, 'utf8');
    form.append('files', metadataBuffer, {
      filename: 'metadata.json',
      contentType: 'application/json'
    });
    
    // Also include any imported OpenZeppelin contracts if they exist
    const openzeppelinPath = path.join(process.cwd(), 'node_modules', '@openzeppelin', 'contracts');
    if (fs.existsSync(openzeppelinPath)) {
      // Add OpenZeppelin imports that our HyperERC721 contract uses
      const imports = [
        'token/ERC721/ERC721.sol',
        'token/ERC721/extensions/ERC721Enumerable.sol',
        'token/ERC721/extensions/ERC721URIStorage.sol',
        'token/ERC721/extensions/ERC721Pausable.sol',
        'access/Ownable.sol',
        'token/ERC721/IERC721.sol',
        'token/ERC721/IERC721Receiver.sol',
        'token/ERC721/extensions/IERC721Metadata.sol',
        'token/ERC721/extensions/IERC721Enumerable.sol',
        'utils/Context.sol',
        'utils/Strings.sol',
        'utils/introspection/ERC165.sol',
        'utils/introspection/IERC165.sol',
        'interfaces/IERC2981.sol',
        'token/common/ERC2981.sol',
        'utils/math/Math.sol',
        'utils/math/SignedMath.sol',
        'utils/Pausable.sol'
      ];
      
      for (const importPath of imports) {
        const fullImportPath = path.join(openzeppelinPath, importPath);
        if (fs.existsSync(fullImportPath)) {
          const importSource = fs.readFileSync(fullImportPath, 'utf8');
          form.append('files', importSource, `@openzeppelin/contracts/${importPath}`);
        }
      }
    }

    // Submit to Sourcify
    console.log("\n📤 Submitting to Sourcify...");
    const verifyUrl = 'https://sourcify.parsec.finance/verify';
    
    const response = await axios.post(verifyUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.status === 200) {
      console.log("✅ Contract verified successfully!");
      console.log(`🔍 View verified contract: https://sourcify.parsec.finance/#/lookup/${deployment.contractAddress}`);
      console.log(`📊 Verification result:`, response.data);
    } else {
      console.log("⚠️ Verification response:", response.status, response.data);
    }

  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.response) {
      console.log("📊 Response status:", error.response.status);
      console.log("📊 Response data:", error.response.data);
    }
    
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure you've compiled the contracts: npm run compile");
    console.log("2. Make sure you have deployed a contract first");
    console.log("3. Verify the deployment history file contains correct information");
    console.log("4. Ensure the contract was deployed with the same source code");
    console.log("5. Try again in a few minutes (Sourcify might be busy)");
    console.log("6. You can override with env vars: CONTRACT_ADDRESS, CONTRACT_NAME");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 