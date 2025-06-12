import { expect } from 'chai';
import { ethers } from 'hardhat';
import { HyperERC721 } from '../typechain-types';

describe('HyperERC721', function () {
  let nftContract: HyperERC721;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const COLLECTION_NAME = 'Test NFT Collection';
  const COLLECTION_SYMBOL = 'TNC';
  const MAX_SUPPLY = 1000;
  const BASE_URI = 'https://api.test.com/metadata/';
  const USE_JSON_EXTENSION = true;
  const ROYALTY_FEE_BPS = 500; // 5%

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory('HyperERC721');
    const deployedContract = await NFTFactory.deploy(
      COLLECTION_NAME, 
      COLLECTION_SYMBOL, 
      MAX_SUPPLY, 
      BASE_URI, 
      owner.address, 
      ROYALTY_FEE_BPS,
      USE_JSON_EXTENSION
    );
    await deployedContract.waitForDeployment();
    nftContract = deployedContract as unknown as HyperERC721;
  });

  describe('Deployment', function () {
    it('Should set the right collection name and symbol', async function () {
      expect(await nftContract.name()).to.equal(COLLECTION_NAME);
      expect(await nftContract.symbol()).to.equal(COLLECTION_SYMBOL);
    });

    it('Should set the right max supply', async function () {
      expect(await nftContract.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it('Should set the right owner', async function () {
      expect(await nftContract.owner()).to.equal(owner.address);
    });

    it('Should set the right royalty info', async function () {
      const [recipient, amount] = await nftContract.royaltyInfo(1, 10000);
      expect(recipient).to.equal(owner.address);
      expect(amount).to.equal(500); // 5% of 10000
    });

    it('Should start with token ID 1', async function () {
      expect(await nftContract.nextTokenId()).to.equal(1);
    });
  });

  describe('Minting', function () {
    it('Should allow owner to mint NFTs', async function () {
      const mintQuantity = 5;
      await nftContract.mint(addr1.address, mintQuantity);

      expect(await nftContract.balanceOf(addr1.address)).to.equal(mintQuantity);
      expect(await nftContract.totalSupply()).to.equal(mintQuantity);
      expect(await nftContract.nextTokenId()).to.equal(mintQuantity + 1);
    });

    it('Should not allow non-owner to mint NFTs', async function () {
      await expect(
        nftContract.connect(addr1).mint(addr2.address, 1)
      ).to.be.revertedWithCustomError(nftContract, 'OwnableUnauthorizedAccount');
    });

    it('Should not allow minting beyond max supply', async function () {
      await expect(
        nftContract.mint(addr1.address, MAX_SUPPLY + 1)
      ).to.be.revertedWith('Exceeds maximum supply');
    });

    it('Should assign correct token IDs', async function () {
      await nftContract.mint(addr1.address, 3);
      
      expect(await nftContract.ownerOf(1)).to.equal(addr1.address);
      expect(await nftContract.ownerOf(2)).to.equal(addr1.address);
      expect(await nftContract.ownerOf(3)).to.equal(addr1.address);
    });
  });

  describe('Public Minting', function () {
    beforeEach(async function () {
      // Enable public mint with 0.01 ETH price
      await nftContract.setPublicMintSettings(true, ethers.parseEther('0.01'), 5);
    });

    it('Should allow public minting when enabled', async function () {
      await nftContract.connect(addr1).publicMint(2, { 
        value: ethers.parseEther('0.02') 
      });

      expect(await nftContract.balanceOf(addr1.address)).to.equal(2);
      expect(await nftContract.mintsPerAddress(addr1.address)).to.equal(2);
    });

    it('Should not allow public minting without sufficient payment', async function () {
      await expect(
        nftContract.connect(addr1).publicMint(2, { 
          value: ethers.parseEther('0.01') 
        })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('Should not allow minting more than max per address', async function () {
      await expect(
        nftContract.connect(addr1).publicMint(6, { 
          value: ethers.parseEther('0.06') 
        })
      ).to.be.revertedWith('Exceeds max mints per address');
    });

    it('Should not allow public minting when disabled', async function () {
      await nftContract.setPublicMintSettings(false, ethers.parseEther('0.01'), 5);
      
      await expect(
        nftContract.connect(addr1).publicMint(1, { 
          value: ethers.parseEther('0.01') 
        })
      ).to.be.revertedWith('Public mint not enabled');
    });
  });

  describe('Metadata', function () {
    it('Should return correct base URI with JSON extension', async function () {
      await nftContract.mint(addr1.address, 1);
      expect(await nftContract.tokenURI(1)).to.equal(BASE_URI + '1.json');
    });

    it('Should allow owner to update base URI', async function () {
      const newBaseURI = 'https://api.newtest.com/metadata/';
      await nftContract.setBaseURI(newBaseURI);
      
      await nftContract.mint(addr1.address, 1);
      expect(await nftContract.tokenURI(1)).to.equal(newBaseURI + '1.json');
    });

    it('Should allow owner to toggle JSON extension', async function () {
      await nftContract.mint(addr1.address, 1);
      expect(await nftContract.tokenURI(1)).to.equal(BASE_URI + '1.json');
      
      // Disable JSON extension
      await nftContract.setJsonExtension(false);
      expect(await nftContract.tokenURI(1)).to.equal(BASE_URI + '1');
      
      // Re-enable JSON extension
      await nftContract.setJsonExtension(true);
      expect(await nftContract.tokenURI(1)).to.equal(BASE_URI + '1.json');
    });

    it('Should not allow non-owner to update base URI', async function () {
      await expect(
        nftContract.connect(addr1).setBaseURI('https://hack.com/')
      ).to.be.revertedWithCustomError(nftContract, 'OwnableUnauthorizedAccount');
    });

    it('Should not allow non-owner to toggle JSON extension', async function () {
      await expect(
        nftContract.connect(addr1).setJsonExtension(false)
      ).to.be.revertedWithCustomError(nftContract, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Royalties', function () {
    it('Should return correct royalty info', async function () {
      const salePrice = 10000;
      const [recipient, amount] = await nftContract.royaltyInfo(1, salePrice);
      
      expect(recipient).to.equal(owner.address);
      expect(amount).to.equal(500); // 5% of 10000
    });

    it('Should allow owner to update royalty settings', async function () {
      await nftContract.setRoyaltyInfo(addr1.address, 750); // 7.5%
      
      const [recipient, amount] = await nftContract.royaltyInfo(1, 10000);
      expect(recipient).to.equal(addr1.address);
      expect(amount).to.equal(750);
    });

    it('Should not allow royalty fee higher than 10%', async function () {
      await expect(
        nftContract.setRoyaltyInfo(addr1.address, 1001) // 10.01%
      ).to.be.revertedWith('Royalty fee too high');
    });
  });

  describe('Pausable', function () {
    it('Should allow owner to pause and unpause', async function () {
      await nftContract.pause();
      
      await expect(
        nftContract.connect(addr1).publicMint(1, { value: ethers.parseEther('0.01') })
      ).to.be.revertedWithCustomError(nftContract, 'EnforcedPause');
      
      await nftContract.unpause();
      // Should work again after unpause (need to enable public mint first)
      await nftContract.setPublicMintSettings(true, ethers.parseEther('0.01'), 5);
      await nftContract.connect(addr1).publicMint(1, { value: ethers.parseEther('0.01') });
      
      expect(await nftContract.balanceOf(addr1.address)).to.equal(1);
    });
  });

  describe('Withdraw', function () {
    it('Should allow owner to withdraw funds', async function () {
      // Enable public mint and have someone mint
      await nftContract.setPublicMintSettings(true, ethers.parseEther('0.01'), 5);
      await nftContract.connect(addr1).publicMint(2, { value: ethers.parseEther('0.02') });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await nftContract.withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it('Should not allow non-owner to withdraw', async function () {
      await expect(
        nftContract.connect(addr1).withdraw()
      ).to.be.revertedWithCustomError(nftContract, 'OwnableUnauthorizedAccount');
    });
  });
});
