// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title HyperERC721
 * @dev An ERC721 NFT contract optimized for Hyperliquid HyperEVM
 */
contract HyperERC721 is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Pausable, Ownable, IERC2981 {
    using Strings for uint256;
    
    uint256 private _nextTokenId;
    uint256 public maxSupply;
    uint256 public publicMintPrice;
    uint256 public maxMintsPerAddress;
    bool public publicMintEnabled;
    string private _baseTokenURI;
    
    // Metadata configuration
    bool public useJsonExtension; // Whether to append .json to tokenURI
    
    // Royalty info
    address public royaltyRecipient;
    uint96 public royaltyFeeBps; // Basis points (e.g., 500 = 5%)
    
    // Mapping to track mints per address
    mapping(address => uint256) public mintsPerAddress;
    
    /**
     * @dev Constructor that sets up the NFT collection
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param maxSupply_ The maximum number of NFTs that can be minted
     * @param baseURI The base URI for token metadata
     * @param royaltyRecipient_ Address to receive royalties
     * @param royaltyFeeBps_ Royalty fee in basis points (e.g., 500 = 5%)
     * @param useJsonExtension_ Whether to append .json extension to tokenURI
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply_,
        string memory baseURI,
        address royaltyRecipient_,
        uint96 royaltyFeeBps_,
        bool useJsonExtension_
    ) ERC721(name, symbol) Ownable(msg.sender) {
        maxSupply = maxSupply_;
        _baseTokenURI = baseURI;
        royaltyRecipient = royaltyRecipient_;
        royaltyFeeBps = royaltyFeeBps_;
        useJsonExtension = useJsonExtension_;
        _nextTokenId = 1; // Start token IDs at 1
        
        // Default settings
        publicMintPrice = 0.01 ether; // 0.01 HYPE
        maxMintsPerAddress = 10;
        publicMintEnabled = false;
    }
    
    /**
     * @dev Mint NFTs to a specific address (only owner)
     * @param to The address to mint NFTs to
     * @param quantity The number of NFTs to mint
     */
    function mint(address to, uint256 quantity) public onlyOwner {
        require(_nextTokenId + quantity - 1 <= maxSupply, "Exceeds maximum supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }
    
    /**
     * @dev Public mint function (when enabled)
     * @param quantity The number of NFTs to mint
     */
    function publicMint(uint256 quantity) external payable whenNotPaused {
        require(publicMintEnabled, "Public mint not enabled");
        require(quantity > 0, "Quantity must be greater than 0");
        require(_nextTokenId + quantity - 1 <= maxSupply, "Exceeds maximum supply");
        require(mintsPerAddress[msg.sender] + quantity <= maxMintsPerAddress, "Exceeds max mints per address");
        require(msg.value >= publicMintPrice * quantity, "Insufficient payment");
        
        mintsPerAddress[msg.sender] += quantity;
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }
    }
    
    /**
     * @dev Set the base URI for token metadata
     * @param baseURI The new base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Set whether to use .json extension for metadata URLs
     * @param useExtension Whether to append .json to tokenURI
     */
    function setJsonExtension(bool useExtension) external onlyOwner {
        useJsonExtension = useExtension;
    }
    
    /**
     * @dev Set public mint settings
     * @param enabled Whether public mint is enabled
     * @param price Price per NFT in wei
     * @param maxPerAddress Maximum mints per address
     */
    function setPublicMintSettings(bool enabled, uint256 price, uint256 maxPerAddress) external onlyOwner {
        publicMintEnabled = enabled;
        publicMintPrice = price;
        maxMintsPerAddress = maxPerAddress;
    }
    
    /**
     * @dev Set royalty information
     * @param recipient Address to receive royalties
     * @param feeBps Royalty fee in basis points
     */
    function setRoyaltyInfo(address recipient, uint96 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Royalty fee too high"); // Max 10%
        royaltyRecipient = recipient;
        royaltyFeeBps = feeBps;
    }
    
    /**
     * @dev Withdraw contract balance to owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Pause the contract (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get the next token ID to be minted
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * @dev Get the total number of minted tokens
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @dev Returns the base URI for tokens
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev See {IERC2981-royaltyInfo}
     */
    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltyRecipient;
        royaltyAmount = (salePrice * royaltyFeeBps) / 10000;
    }
    
    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        _requireOwned(tokenId);

        // First check if individual token URI is set (ERC721URIStorage)
        // We'll try to get the parent's tokenURI and see if it's just base + tokenId
        string memory parentURI = ERC721URIStorage.tokenURI(tokenId);
        string memory baseURI = _baseURI();
        
        // If there's no baseURI, return the parent's result (could be individual URI or empty)
        if (bytes(baseURI).length == 0) {
            return parentURI;
        }
        
        // Check if the parent returned an individual URI (not base + tokenId pattern)
        string memory defaultTokenIdStr = tokenId.toString();
        string memory expectedBaseURI = string(abi.encodePacked(baseURI, defaultTokenIdStr));
        
        // If parent URI doesn't match the expected base + tokenId pattern, it's an individual URI
        if (keccak256(abi.encodePacked(parentURI)) != keccak256(abi.encodePacked(expectedBaseURI))) {
            return parentURI; // Return the individual URI
        }

        // Build URI from base + tokenId + optional .json extension
        if (useJsonExtension) {
            return string(abi.encodePacked(baseURI, defaultTokenIdStr, ".json"));
        } else {
            return string(abi.encodePacked(baseURI, defaultTokenIdStr));
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
} 