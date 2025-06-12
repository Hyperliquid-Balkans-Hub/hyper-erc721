import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import * as fs from 'fs';
import * as path from 'path';

const deployNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Get NFT configuration from environment variables or use defaults
  const collectionName = process.env.COLLECTION_NAME || 'MyNFTCollection';
  const collectionSymbol = process.env.COLLECTION_SYMBOL || 'MNC';
  const maxSupply = process.env.MAX_SUPPLY || '10000';
  const baseURI = process.env.BASE_URI || 'https://api.example.com/metadata/';
  const royaltyRecipient = process.env.ROYALTY_RECIPIENT || deployer;
  const royaltyFeeBps = process.env.ROYALTY_FEE_BPS || '500';
  
  // Minting configuration
  const mintQuantity = parseInt(process.env.MINT_QUANTITY || '10');
  const publicMintEnabled = process.env.PUBLIC_MINT_ENABLED === 'true';
  const publicMintPrice = process.env.PUBLIC_MINT_PRICE || '0.01';
  const maxMintsPerAddress = process.env.MAX_MINTS_PER_ADDRESS || '10';
  
  // Marketplace configuration
  const listOnMarketplace = process.env.LIST_ON_MARKETPLACE === 'true';

  console.log('Deploying NFT collection with the following parameters:');
  console.log(`- Collection Name: ${collectionName}`);
  console.log(`- Collection Symbol: ${collectionSymbol}`);
  console.log(`- Max Supply: ${maxSupply}`);
  console.log(`- Base URI: ${baseURI}`);
  console.log(`- Royalty Recipient: ${royaltyRecipient}`);
  console.log(`- Royalty Fee: ${Number(royaltyFeeBps) / 100}%`);
  console.log(`- Initial Mint Quantity: ${mintQuantity}`);
  console.log(`- Public Mint Enabled: ${publicMintEnabled ? 'Yes' : 'No'}`);
  if (publicMintEnabled) {
    console.log(`- Public Mint Price: ${publicMintPrice} HYPE`);
    console.log(`- Max Mints Per Address: ${maxMintsPerAddress}`);
  }
  console.log(`- Marketplace Listing: ${listOnMarketplace ? 'Yes' : 'No'}`);
  console.log(`- Deployer: ${deployer}`);

  const nftContract = await deploy('HyperERC721', {
    from: deployer,
    args: [collectionName, collectionSymbol, maxSupply, baseURI, royaltyRecipient, royaltyFeeBps],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`\n✅ NFT Collection deployed successfully!`);
  console.log(`📍 Contract Address: ${nftContract.address}`);
  console.log(`🔗 Transaction Hash: ${nftContract.transactionHash}`);
  console.log(`⛽ Gas Used: ${nftContract.receipt?.gasUsed?.toString()}`);
  console.log(`🔍 View on Purrsec: https://purrsec.com/address/${nftContract.address}/transactions`);

  // Step 2: Mint initial NFTs if quantity > 0
  if (mintQuantity > 0) {
    console.log(`\n🎨 Minting ${mintQuantity} initial NFTs...`);
    
    // Get the deployed contract instance
    const contractInstance = await hre.ethers.getContractAt('HyperERC721', nftContract.address);
    
    // Mint NFTs to deployer
    const mintTx = await contractInstance.mint(deployer, mintQuantity);
    await mintTx.wait();
    
    console.log(`✅ Successfully minted ${mintQuantity} NFTs to deployer!`);
    console.log(`🔗 Mint Transaction: ${mintTx.hash}`);
    console.log(`⛽ Mint Gas Used: ${(await mintTx.wait()).gasUsed?.toString()}`);
  } else {
    console.log(`\n⏭️  Skipping initial mint (MINT_QUANTITY = 0)`);
  }

  // Step 3: Configure public mint settings (if enabled)
  if (publicMintEnabled) {
    console.log(`\n⚙️  Configuring public mint settings...`);
    
    try {
      const contractInstance = await hre.ethers.getContractAt('HyperERC721', nftContract.address);
      const signer = await hre.ethers.getSigner(deployer);
      const contract = contractInstance.connect(signer) as any;
      
      // Convert price to wei
      const priceInWei = hre.ethers.parseEther(publicMintPrice);
      
      // Set public mint settings
      const configTx = await contract.setPublicMintSettings(
        publicMintEnabled,
        priceInWei,
        maxMintsPerAddress
      );
      await configTx.wait();
      
      console.log(`✅ Public mint configured successfully!`);
      console.log(`💰 Price: ${publicMintPrice} HYPE per NFT`);
      console.log(`📊 Max per address: ${maxMintsPerAddress}`);
      console.log(`🔗 Config Transaction: ${configTx.hash}`);
    } catch (error: any) {
      console.error(`❌ Failed to configure public mint:`, error.message || error);
    }
  } else {
    console.log(`\n⏭️  Public mint disabled`);
  }

  // Step 4: Marketplace preparation (if enabled)
  if (listOnMarketplace) {
    console.log(`\n🏪 Preparing for marketplace listing...`);
    console.log(`📝 Collection metadata should be available at: ${baseURI}`);
    console.log(`💎 Royalty settings: ${Number(royaltyFeeBps) / 100}% to ${royaltyRecipient}`);
    console.log(`🚀 Ready for listing on NFT marketplaces!`);
  }

  // Create deployment history record
  const deploymentRecord = `# ${collectionName} (${collectionSymbol}) - NFT Deployment Record

## Basic Information
- **Collection Name:** ${collectionName}
- **Collection Symbol:** ${collectionSymbol}
- **Max Supply:** ${Number(maxSupply).toLocaleString()} NFTs
- **Base URI:** ${baseURI}
- **Initial Mint:** ${mintQuantity} NFTs

## Deployment Details
- **Network:** ${hre.network.name === 'hyperliquid' ? 'Hyperliquid HyperEVM Mainnet (Chain ID: 999)' : hre.network.name}
- **Contract Address:** \`${nftContract.address}\`
- **Transaction Hash:** \`${nftContract.transactionHash}\`
- **Deployer Address:** \`${deployer}\`
- **Deployment Date:** ${new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z/, ' UTC')}
- **Gas Used:** ${nftContract.receipt?.gasUsed?.toString() || 'N/A'}
- **Gas Price:** 1.0 Gwei (configured in hardhat.config.ts)

## Royalty Information
- **Royalty Recipient:** \`${royaltyRecipient}\`
- **Royalty Fee:** ${Number(royaltyFeeBps) / 100}% (${royaltyFeeBps} basis points)

## Public Mint Settings
- **Public Mint Enabled:** ${publicMintEnabled ? 'Yes' : 'No'}
${publicMintEnabled ? `- **Mint Price:** ${publicMintPrice} HYPE per NFT
- **Max Mints Per Address:** ${maxMintsPerAddress}` : ''}

## Contract Functions (HyperERC721)
- ✅ Standard ERC721 (transfer, approve, etc.)
- ✅ Enumerable (totalSupply, tokenByIndex, etc.)
- ✅ URI Storage (individual token URIs)
- ✅ Pausable (emergency stop functionality)
- ✅ Ownable (access control)
- ✅ Royalty Standard (EIP-2981)
- ✅ Public Mint (configurable)
- ✅ Batch Minting (owner only)

## Links
- **View on Purrsec:** https://purrsec.com/address/${nftContract.address}/transactions
- **View Transactions:** https://purrsec.com/address/${nftContract.address}/transactions

## Notes
- Deployed successfully${hre.network.name === 'hyperliquid' ? ' with Big Blocks enabled' : ''}
- Initial minting: ${mintQuantity} NFTs minted to deployer
- ${mintQuantity > 0 ? `Remaining ${Number(maxSupply) - mintQuantity} NFTs available for minting` : `All ${maxSupply} NFTs available for minting`}
- Owner can mint additional NFTs and configure settings
- Contract supports marketplace royalties (EIP-2981)
- Contract verification is not available on Hyperliquid HyperEVM

---
*This file was auto-generated on ${new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z/, ' UTC')}*
`;

  // Ensure deployment_history directory exists
  const historyDir = path.join(process.cwd(), 'deployment_history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Create filename with timestamp and collection info
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${timestamp}_${collectionSymbol}_${nftContract.address.slice(0, 8)}.md`;
  const filepath = path.join(historyDir, filename);

  // Write deployment record
  fs.writeFileSync(filepath, deploymentRecord);
  
  console.log(`📝 Deployment record saved: deployment_history/${filename}`);

  console.log(`\n🎉 NFT Collection deployment completed!`);
  console.log(`🖼️  Collection: ${collectionName} (${collectionSymbol})`);
  console.log(`🔢 Total Minted: ${mintQuantity}/${maxSupply}`);
  console.log(`🔍 View Collection: https://purrsec.com/address/${nftContract.address}/transactions`);
};

export default deployNFT;
deployNFT.tags = ['HyperERC721', 'nft']; 