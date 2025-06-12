# HyperERC721 NFT Deployer for Hyperliquid HyperEVM

A simple, ready-to-use Hardhat setup for deploying HyperERC721 NFT collections on **Hyperliquid HyperEVM Mainnet**. Just add your private key and deploy!

# 🚀 QUICK START GUIDE

**🔴 IMPORTANT: You need $100+ USDC on HyperCore to deploy HyperERC721 NFTs!**

## Step 1: Install Dependencies
```bash
npm install
```

**If you get dependency conflicts, try:**
```bash
npm install --legacy-peer-deps
```

## Step 2: Setup Environment File
```bash
cp env.example .env
```

Edit `.env` file with your details:
```bash
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Your NFT collection details
COLLECTION_NAME=YourNFTCollection
COLLECTION_SYMBOL=YNC
MAX_SUPPLY=10000
BASE_URI=https://api.yourproject.com/metadata/

# Metadata configuration  
# Set to true if your metadata URLs should end with .json (e.g., /1.json)
# Set to false if your metadata URLs are without extension (e.g., /1)
USE_JSON_EXTENSION=true

# Royalty configuration
ROYALTY_RECIPIENT=0x0000000000000000000000000000000000000000
ROYALTY_FEE_BPS=500

# Initial minting
MINT_QUANTITY=10

# Optional: Public mint settings
PUBLIC_MINT_ENABLED=false
PUBLIC_MINT_PRICE=0.01
MAX_MINTS_PER_ADDRESS=10
```

## Step 3: Prepare Your Wallet
1. **Get HYPE tokens** for gas fees from:
   - https://hybridge.xyz/?refUser=209f2f41 (HyBridge)
   - https://www.relay.link/bridge/hyperevm (Relay)

2. **Deposit $100+ USDC to HyperCore**:
   - Go to https://app.hyperliquid.xyz/trade
   - Deposit at least $100 USDC to your account

## Step 4: Enable Big Blocks
1. Visit https://hyperevm-block-toggle.vercel.app
2. Connect your wallet (must have $100+ USDC on HyperCore)
3. Toggle to "Big Blocks" mode
4. Wait 2-3 minutes for activation

## Step 5: Deploy Your NFT Collection
```bash
npm run deploy
```

## Step 6: Switch Back to Fast Blocks (Recommended)
1. Return to https://hyperevm-block-toggle.vercel.app
2. Toggle back to "Fast Blocks"

**🎉 Done! Your HyperERC721 NFT collection is now deployed on Hyperliquid HyperEVM Mainnet!**

**🔍 View your collection:** After deployment, you can view your collection and transactions at https://purrsec.com

**🚀 Launch your NFT:** Consider launching your NFT collection with [Drip Trade's HyperLaunch](https://drip-trade.gitbook.io/drip.trade/launchpad/quickstart) - Drip's exclusive NFT launchpad built to accelerate the NFT ecosystem on Hyperliquid

**🛒 Secondary marketplace:** Trade NFTs on the secondary market at [Drip.Trade](https://drip.trade/) - the leading NFT marketplace for Hyperliquid

**📝 Deployment Record:** A detailed deployment record is automatically saved in the `deployment_history/` folder

---

# 📖 DETAILED DOCUMENTATION

## 🔧 Configuration Options

You can customize your NFT collection by setting these environment variables in your `.env` file:

| Variable         | Description                           | Default   | Example        |
| ---------------- | ------------------------------------- | --------- | -------------- |
| `COLLECTION_NAME`| Full name of your NFT collection      | "MyNFTCollection" | "Awesome Art" |
| `COLLECTION_SYMBOL`| Collection symbol/ticker            | "MNC"     | "AWE"          |
| `MAX_SUPPLY`     | Maximum number of NFTs in collection  | "10000"   | "5555"         |
| `BASE_URI`       | Base URI for metadata                 | "https://api.example.com/metadata/" | "https://api.myproject.com/metadata/" |
| `USE_JSON_EXTENSION`| Append .json to metadata URLs       | "true"    | "false"        |
| `ROYALTY_RECIPIENT`| Address to receive royalties        | deployer  | "0x123..."     |
| `ROYALTY_FEE_BPS`| Royalty fee in basis points (1-1000) | "500"     | "750"          |
| `MINT_QUANTITY`  | Initial NFTs to mint to deployer      | "10"      | "100"          |
| `PUBLIC_MINT_ENABLED`| Enable public minting             | "false"   | "true"         |
| `PUBLIC_MINT_PRICE`| Price per NFT in HYPE               | "0.01"    | "0.05"         |
| `MAX_MINTS_PER_ADDRESS`| Max NFTs per address in public mint | "10"    | "3"            |

## 📋 Available Commands

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npm run compile`      | Compile smart contracts         |
| `npm run deploy`       | Deploy to Hyperliquid mainnet   |
| `npm run deploy:local` | Deploy to local hardhat network |
| `npm run test`         | Run contract tests              |
| `npm run verify`       | Verify contracts with Sourcify  |
| `npm run clean`        | Clean compiled artifacts        |
| `npm run node`         | Start local Hardhat node        |
| `npm run contract-info`| Get comprehensive contract info |
| `npm run enable-public-mint` | Enable public minting |
| `npm run disable-public-mint` | Disable public minting |
| `npm run mint-nfts`    | Mint NFTs (owner or public)     |
| `npm run update-metadata` | Update base URI or JSON extension |
| `npm run withdraw`     | Withdraw contract funds          |

## 🔍 Contract Features

The `HyperERC721` contract includes:

- ✅ Standard ERC721 functionality (transfer, approve, etc.)
- ✅ Enumerable extension (totalSupply, tokenByIndex, etc.)
- ✅ URI Storage (individual token metadata)
- ✅ Pausable (emergency stop functionality)
- ✅ Ownable (access control)
- ✅ Royalty Standard (EIP-2981) 
- ✅ Public Mint (configurable pricing and limits)
- ✅ Batch Minting (owner only)
- ✅ Withdrawable (contract earnings)
- ✅ Built with OpenZeppelin contracts (secure & audited)

## 🎨 Minting Process

The deployment process consists of three steps:

1. **Deploy Contract**: Creates the NFT collection contract
2. **Initial Mint**: Mints specified quantity to the deployer
3. **Configure Settings**: Sets up public mint and royalty settings

### Minting Configuration

- **`MINT_QUANTITY=10`**: Mints 10 NFTs to deployer initially (default)
- **`MINT_QUANTITY=100`**: Mints 100 NFTs for immediate distribution
- **`MINT_QUANTITY=0`**: No initial minting, all NFTs available for public mint

This gives you full control over NFT distribution and allows for:
- **Founder allocation** (mint some NFTs to team/founders)
- **Community distribution** (mint 0 initially, all via public mint)
- **Hybrid approach** (mint some to deployer, rest for public)

### Contract Functions

**Standard ERC721:**

- `transfer(to, tokenId)` - Transfer NFT
- `approve(to, tokenId)` - Approve NFT transfer
- `transferFrom(from, to, tokenId)` - Transfer approved NFT
- `balanceOf(account)` - Get NFT balance
- `ownerOf(tokenId)` - Get NFT owner
- `totalSupply()` - Get total minted NFTs

**Additional Features:**

- `mint(to, quantity)` - Mint NFTs (owner only)
- `publicMint(quantity)` - Public mint function (when enabled)
- `setBaseURI(baseURI)` - Update metadata base URI
- `setJsonExtension(useExtension)` - Set metadata URL format (with/without .json)
- `setPublicMintSettings(enabled, price, maxPerAddress)` - Configure public mint
- `setRoyaltyInfo(recipient, feeBps)` - Update royalty settings
- `withdraw()` - Withdraw contract earnings
- `pause()` / `unpause()` - Emergency controls

### Metadata URL Flexibility

The contract supports both metadata URL formats:

**With .json extension** (`USE_JSON_EXTENSION=true`):
- Token 1: `https://api.example.com/metadata/1.json`
- Token 2: `https://api.example.com/metadata/2.json`

**Without extension** (`USE_JSON_EXTENSION=false`):
- Token 1: `https://api.example.com/metadata/1`
- Token 2: `https://api.example.com/metadata/2`

This is perfect for decentralized storage systems like:
- **Swarm/bzz.link**: `https://bzz.link/bzz/hash/1` or `https://bzz.link/bzz/hash/1.json`
- **IPFS**: `https://ipfs.io/ipfs/hash/1` or `https://ipfs.io/ipfs/hash/1.json`
- **Traditional APIs**: Both formats are commonly used

The setting can be configured during deployment and changed later by the contract owner using the `setJsonExtension()` function.

## 🛠️ Contract Management Scripts

After deploying your NFT collection, you can use these convenient scripts to manage your contract:

### **📊 Contract Information**
```bash
npm run contract-info                    # Info for latest deployment
npm run contract-info 0xContractAddress  # Info for specific contract
```
Shows comprehensive contract details including minting stats, settings, and useful links.

### **🎯 Public Minting Management**
```bash
npm run enable-public-mint                    # Enable for latest deployment
npm run enable-public-mint 0xContractAddress  # Enable for specific contract
npm run disable-public-mint                   # Disable for latest deployment
npm run disable-public-mint 0xContractAddress # Disable for specific contract
```
Control public minting with environment variables:
- `PUBLIC_MINT_PRICE=0.01` - Price in HYPE
- `MAX_MINTS_PER_ADDRESS=10` - Max mints per address

### **🎨 NFT Minting**
```bash
npm run mint-nfts                                    # Owner mint 1 NFT to signer
npm run mint-nfts 0xContractAddress                  # Owner mint 1 NFT to signer
npm run mint-nfts 0xContractAddress owner 5          # Owner mint 5 NFTs to signer
npm run mint-nfts 0xContractAddress owner 5 0xAddr   # Owner mint 5 NFTs to address
npm run mint-nfts 0xContractAddress public 3         # Public mint 3 NFTs
```

### **📄 Metadata Updates**
```bash
npm run update-metadata baseuri https://new-api.com/metadata/
npm run update-metadata extension false
npm run update-metadata 0xContractAddress baseuri https://new-api.com/metadata/
npm run update-metadata 0xContractAddress extension true
```

### **💰 Fund Management**
```bash
npm run withdraw                    # Withdraw from latest deployment
npm run withdraw 0xContractAddress  # Withdraw from specific contract
```

### **🔧 Smart Defaults**
All scripts automatically use your **latest deployed contract** if no address is specified, making management seamless for single-collection projects.

## 🌐 Network Configuration

### Hyperliquid HyperEVM Mainnet

- **Network Name:** Hyperliquid HyperEVM
- **RPC URL:** `https://rpc.hyperliquid.xyz/evm`
- **Chain ID:** 999
- **Explorer:** https://purrsec.com (Only working explorer for HyperEVM)
- **Bridge:** Get HYPE tokens from:
  - https://hybridge.xyz/?refUser=209f2f41 (HyBridge)
  - https://www.relay.link/bridge/hyperevm?fromChainId=999&fromCurrency=0x0000000000000000000000000000000000000000&toCurrency=0x0000000000000000000000000000000000000000 (Relay)
  - https://app.debridge.finance/ (DeBridge)
  - https://www.gas.zip/ (Gas.zip)

### Adding to MetaMask

To add Hyperliquid HyperEVM to MetaMask:

1. Open MetaMask
2. Go to Settings > Networks > Add Network
3. Enter these details:
   - **Network Name:** Hyperliquid HyperEVM
   - **RPC URL:** `https://rpc.hyperliquid.xyz/evm`
   - **Chain ID:** 999
   - **Currency Symbol:** HYPE
   - **Explorer:** `https://purrsec.com`

## 📁 Project Structure

```
nft/
├── contracts/
│   └── HyperERC721.sol          # ERC721 NFT contract for HyperEVM
├── deploy/
│   └── 01_deploy_nft.ts         # NFT deployment script
├── deployment_history/          # Auto-generated deployment records
│   ├── README.md               # Deployment history guide
│   └── *.md                    # Individual deployment records
├── test/
│   └── HyperERC721.test.ts      # Contract tests
├── typechain-types/            # Auto-generated TypeScript types
├── hardhat.config.ts            # Hardhat configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── env.example                 # Environment variables example
└── README.md                   # This file
```

## 📝 Deployment History

Every time you deploy an NFT collection, a detailed record is automatically created in the `deployment_history/` folder. Each record includes:

- **Collection Details**: Name, symbol, supply, base URI
- **Deployment Info**: Contract address, transaction hash, gas usage
- **Network Info**: Chain ID, deployer address, timestamp
- **Royalty Settings**: Recipient and fee percentage
- **Mint Configuration**: Initial mint quantity and public mint settings
- **Direct Links**: Links to view your collection on Purrsec

### Example Deployment Record
```
2024-01-15T14-30-25_YNC_0x1234abcd.md
```

This helps you:
- 📋 Keep track of all your deployed collections
- 🔍 Quickly find contract addresses and transaction hashes
- 📊 Compare gas costs across different deployments
- 🔗 Access direct links to view collections on Purrsec
- 📤 Share deployment details with others

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

The tests cover:

- Contract deployment
- NFT minting (owner and public)
- Metadata management
- Royalty functionality
- Access control
- Pausable functionality
- Payment handling

## 🔐 Security Considerations

- **Private Key Safety:** Never share or commit your private key
- **Testnet First:** Always test on testnet before mainnet (when available)
- **Code Review:** Review the contract code before deploying
- **Gas Estimation:** Check gas costs before large deployments
- **Metadata Security:** Ensure your metadata server is secure and reliable
- **Royalty Verification:** Test royalty payments on marketplaces

## ⚡ Big Blocks Configuration

### What are Big Blocks?

Hyperliquid HyperEVM supports two block modes:

- **Fast Blocks** (default): ~1.8 second block times, 5M gas limit
- **Big Blocks**: ~10 second block times, 30M gas limit

ERC721 NFT deployment requires **Big Blocks** due to the higher gas requirements.

### Prerequisites for Big Blocks

1. **💰 $100+ USDC on HyperCore**

   - You need at least $100 USDC deposited on HyperCore (Hyperliquid's central limit order book)
   - You can deposit USDC at: https://app.hyperliquid.xyz/trade

2. **🔧 Enable Big Blocks**

   - Visit: https://hyperevm-block-toggle.vercel.app
   - Connect your wallet with 100+ USDC on HyperCore
   - Toggle to "Big Blocks" mode
   - Wait for confirmation (takes 1-2 minutes)

3. **⛽ Gas Tokens**
   - You still need HYPE tokens for gas fees
   - Get HYPE from:
     - https://hybridge.xyz/?refUser=209f2f41 (HyBridge)
     - https://www.relay.link/bridge/hyperevm?fromChainId=999&fromCurrency=0x0000000000000000000000000000000000000000&toCurrency=0x0000000000000000000000000000000000000000 (Relay)
     - https://app.debridge.finance/ (DeBridge)
     - https://www.gas.zip/ (Gas.zip)

### Why Big Blocks Are Needed

ERC721 contracts with multiple extensions are complex and require significant gas:

- NFT contract deployment: ~20-25M gas
- Initial minting: Additional gas per NFT
- Total requirement: Up to 30M gas

Fast blocks (5M gas limit) cannot accommodate these deployments, hence the need for Big Blocks (30M gas limit).

## 🐛 Troubleshooting

### Common Issues

**1. "insufficient funds" error**

- Make sure your wallet has enough HYPE tokens for gas
- Bridge HYPE tokens from:
  - https://hybridge.xyz/?refUser=209f2f41 (HyBridge)
  - https://www.relay.link/bridge/hyperevm?fromChainId=999&fromCurrency=0x0000000000000000000000000000000000000000&toCurrency=0x0000000000000000000000000000000000000000 (Relay)
  - https://app.debridge.finance/ (DeBridge)
  - https://www.gas.zip/ (Gas.zip)

**2. "nonce too high" error**

- Reset your MetaMask account: Settings > Advanced > Reset Account

**3. "network not found" error**

- Check your RPC URL in `hardhat.config.ts`
- Ensure you're connected to the right network

**4. Deployment stuck**

- Increase gas price in `hardhat.config.ts`
- Check network status

**5. "exceeds block gas limit" error**

This is the most common error when deploying NFT contracts on Hyperliquid.

**❌ Common causes:**

- You don't have 100+ USDC on HyperCore
- Big blocks are not enabled
- You're trying to deploy during fast blocks mode

**✅ Solutions:**

- Ensure you have 100+ USDC on HyperCore: https://app.hyperliquid.xyz/trade
- Enable big blocks: https://hyperevm-block-toggle.vercel.app
- Wait 2-3 minutes after enabling big blocks before deploying
- Verify big blocks are active (blocks should take ~10 seconds instead of ~1.8)

### Getting Help

- Check Hyperliquid Discord for support
- Review Hardhat documentation
- Open an issue in this repository

## 📄 Contract Verification

Contract verification **is now available** on Hyperliquid HyperEVM using Sourcify through Parsec's verifier! This allows you to verify your deployed contracts and make the source code publicly available.

### Verify with Hardhat (Recommended)

This project uses Hardhat, so verification with Hardhat is the most straightforward approach.

**Step 1: Install the verification plugin**
```bash
npm install --save-dev @nomicfoundation/hardhat-verify
```

**Step 2: Add the plugin to your hardhat.config.ts**
```typescript
import "@nomicfoundation/hardhat-verify";
```

**Step 3: Update hardhat.config.ts with Sourcify configuration**
```typescript
module.exports = {
  // ... existing config
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.parsec.finance",
    browserUrl: "https://sourcify.parsec.finance",
  },
  etherscan: {
    apiKey: {
      // This can be any string for Sourcify
      hyperliquid: "no-api-key-needed"
    },
    customChains: [
      {
        network: "hyperliquid",
        chainId: 999,
        urls: {
          apiURL: "https://sourcify.parsec.finance/verify",
          browserURL: "https://sourcify.parsec.finance"
        }
      }
    ]
  }
};
```

**Step 4: Verify your contract**
```bash
npx hardhat verify --network hyperliquid YOUR_CONTRACT_ADDRESS "ConstructorArg1" "ConstructorArg2"
```

For HyperERC721, use the constructor arguments from your deployment:
```bash
npx hardhat verify --network hyperliquid 0xYourContractAddress "YourCollectionName" "YourSymbol" 10000 "https://api.yourproject.com/metadata/" 0xYourAddress 500
```

### Verify with Foundry (Alternative)

If you prefer using Foundry for verification:

```bash
forge verify-contract YOUR_CONTRACT_ADDRESS contracts/HyperERC721.sol:HyperERC721 \
  --chain-id 999 \
  --verifier sourcify \
  --verifier-url https://sourcify.parsec.finance/verify \
  --constructor-args $(cast abi-encode "constructor(string,string,uint256,string,address,uint96)" "YourCollectionName" "YourSymbol" 10000 "https://api.yourproject.com/metadata/" "0xYourAddress" 500)
```

### Troubleshooting Verification

If you encounter errors during verification, try:

1. **Ensure correct chain ID**: Always use `--chain-id 999` for Hyperliquid
2. **Set compiler version explicitly**: Add `--compiler-version 0.8.20` (or your version)
3. **Run from project root**: Execute the command from your project's root directory
4. **Remove explorer settings**: Remove any `ETHERSCAN_API_URL` and `ETHERSCAN_API_KEY` from `.env` and `foundry.toml`
5. **Check constructor arguments**: Ensure they match exactly what was used during deployment
6. **Wait for contract creation**: Make sure your contract deployment transaction is confirmed before verifying

### After Verification

Once verified, you can:
- ✅ View your contract source code publicly
- ✅ Interact with your contract through block explorers
- ✅ Build trust with your community by showing transparent code
- ✅ Enable other developers to fork and learn from your implementation

**View your contracts:** You can still view your deployed contracts and transactions at https://purrsec.com by searching for your contract address.

## 🎯 Example Deployment Output

```
Deploying NFT collection with the following parameters:
- Collection Name: AwesomeNFTs
- Collection Symbol: AWE
- Max Supply: 10,000
- Base URI: https://api.awesome.com/metadata/
- Royalty Fee: 5%
- Initial Mint Quantity: 50

✅ NFT Collection deployed successfully!
📍 Contract Address: 0xabcd...efgh
🔗 Transaction Hash: 0x1234...5678
⛽ Gas Used: 2,234,567
🔍 View on Purrsec: https://purrsec.com/address/0xabcd...efgh/transactions

🎨 Minting 50 initial NFTs...
✅ Successfully minted 50 NFTs to deployer!

📝 Deployment record saved: deployment_history/2024-01-15T14-30-25_AWE_0xabcdefgh.md

🎉 NFT Collection deployment completed!
🖼️  Collection: AwesomeNFTs (AWE)
🔢 Total Minted: 50/10,000
🔍 View Collection: https://purrsec.com/address/0xabcd...efgh/transactions
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready to deploy your NFT collection? Just run `npm run deploy`! 🚀**

---

## 🔴 Support This Project

If this repository helped you deploy your NFT collection successfully and you'd like to give back, consider sending a small donation to support continued development:

**🔴 Donation Address (any chain):**
```
0xB1620c0547744DeDD30F40a863c09D1964532F8C
```

**🔴 Every contribution helps maintain and improve this tool for the community! 🙏**
