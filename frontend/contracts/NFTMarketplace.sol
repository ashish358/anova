// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {

    uint256 private _tokenIds;
    uint256 public listingPrice = 0.025 ether;
    address public owner;

    constructor() ERC721("Metaverse Tokens", "METT") {
        owner = msg.sender;
    }

    // ------------------------------------------------------------

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    struct Bid {
        address bidder;
        uint256 amount;
    }

    // ------------------------------------------------------------

    mapping(uint256 => MarketItem) public idToMarketItem;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) private bidHistory;
    mapping(address => uint256) public pendingReturns;

    // ------------------------------------------------------------

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );
    event MarketItemSold(uint256 indexed tokenId, address buyer, uint256 price);
    event AuctionCreated(uint256 indexed tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 amount);
    event AuctionCancelled(uint256 indexed tokenId);
    event Refund(address indexed bidder, uint256 amount);

    // ------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "ERR1");
        _;
    }

    // ------------------------------------------------------------

    function updateListingPrice(uint256 _listingPrice) external onlyOwner {
        listingPrice = _listingPrice;
    }

    function getListingPrice() external view returns (uint256) {
        return listingPrice;
    }

    // ------------------------------------------------------------

    /**
     * @notice Mint a new NFT and return its tokenId.
     *         The caller (msg.sender) becomes the initial owner.
     */
    function mintNFT(string memory tokenURI) public returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }

    // ------------------------------------------------------------

    /**
     * @notice List a minted NFT for fixed-price sale.
     *         Caller must own the token and pay the listing fee.
     */
    function listItem(uint256 tokenId, uint256 price) public payable nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be > 0");
        require(msg.value == listingPrice, "Must pay listing fee");

        // Transfer NFT to marketplace contract
        _transfer(msg.sender, address(this), tokenId);

        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        emit MarketItemCreated(tokenId, msg.sender, address(this), price, false);
    }

    /**
     * @notice Buy a fixed-price NFT.
     */
    function createMarketSale(uint256 tokenId) public payable nonReentrant {
        MarketItem storage item = idToMarketItem[tokenId];

        require(item.tokenId == tokenId, "Item not found");
        require(!item.sold, "Item already sold");
        require(msg.value == item.price, "Wrong price");
        require(msg.sender != item.seller, "Seller cannot buy own NFT");

        item.sold = true;
        item.owner = payable(msg.sender);

        _transfer(address(this), msg.sender, tokenId);

        // Pay seller (listing fee stays in contract for owner)
        item.seller.transfer(msg.value);

        emit MarketItemSold(tokenId, msg.sender, msg.value);
    }

    /**
     * @notice Re-list an NFT you already own (bought or received).
     */
    function resellToken(uint256 tokenId, uint256 price) public payable nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(idToMarketItem[tokenId].tokenId == tokenId, "Not a market item");
        require(msg.value == listingPrice, "Must pay listing fee");

        MarketItem storage item = idToMarketItem[tokenId];
        item.sold = false;
        item.price = price;
        item.seller = payable(msg.sender);
        item.owner = payable(address(this));

        _transfer(msg.sender, address(this), tokenId);

        emit MarketItemCreated(tokenId, msg.sender, address(this), price, false);
    }

    // ------------------------------------------------------------

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 total = _tokenIds;
        uint256 unsoldCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (
                idToMarketItem[i].tokenId == i &&
                !idToMarketItem[i].sold &&
                idToMarketItem[i].owner == address(this)
            ) {
                unsoldCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](unsoldCount);
        uint256 idx = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (
                idToMarketItem[i].tokenId == i &&
                !idToMarketItem[i].sold &&
                idToMarketItem[i].owner == address(this)
            ) {
                items[idx] = idToMarketItem[i];
                idx++;
            }
        }

        return items;
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 total = _tokenIds;
        uint256 myCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (idToMarketItem[i].owner == msg.sender) {
                myCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](myCount);
        uint256 idx = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (idToMarketItem[i].owner == msg.sender) {
                items[idx] = idToMarketItem[i];
                idx++;
            }
        }

        return items;
    }

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint256 total = _tokenIds;
        uint256 myCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                myCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](myCount);
        uint256 idx = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                items[idx] = idToMarketItem[i];
                idx++;
            }
        }

        return items;
    }

    // ------------------------------------------------------------

    /**
     * @notice Create an auction for a minted NFT.
     *         Caller must own the token and pay the listing fee.
     * @param tokenId       The NFT to auction.
     * @param startingPrice Minimum first bid in wei.
     * @param duration      Auction length in seconds.
     */
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) public payable nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(startingPrice > 0, "Starting price must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(msg.value == listingPrice, "Must pay listing fee");
        require(!auctions[tokenId].active, "Auction already active");

        // Transfer NFT custody to contract
        _transfer(msg.sender, address(this), tokenId);

        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit AuctionCreated(tokenId, startingPrice, block.timestamp + duration);
    }

    // ------------------------------------------------------------

    /**
     * @notice Place a bid on an active auction.
     *         First bid must be >= startingPrice.
     *         Subsequent bids must be >= highestBid + 0.01 ETH.
     *         Outbid amounts are credited to pendingReturns for withdrawal.
     */
    function placeBid(uint256 tokenId) public payable nonReentrant {
        Auction storage auction = auctions[tokenId];

        require(auction.seller != address(0), "Auction not found");
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction already ended");
        require(msg.sender != auction.seller, "Seller cannot bid");

        uint256 minBid;
        if (auction.highestBid == 0) {
            minBid = auction.startingPrice;
        } else {
            minBid = auction.highestBid + 0.01 ether;
        }

        require(msg.value >= minBid, "Bid too low");

        // Refund previous highest bidder via pull-pattern
        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
            emit Refund(auction.highestBidder, auction.highestBid);
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        bidHistory[tokenId].push(Bid({ bidder: msg.sender, amount: msg.value }));

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    // ------------------------------------------------------------

    /**
     * @notice End an auction. Callable by seller at any time.
     *         If a winner exists: NFT -> winner, payment -> seller.
     *         If no bids: NFT -> returned to seller.
     */
    function endAuction(uint256 tokenId) public nonReentrant {
        Auction storage auction = auctions[tokenId];

        require(auction.seller != address(0), "Auction not found");
        require(auction.active, "Auction already ended");
        require(
            msg.sender == auction.seller || msg.sender == owner,
            "Not authorized"
        );

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            //  NFT held by this contract - transfer to winner
            _transfer(address(this), auction.highestBidder, tokenId);

            //  Pay seller
            payable(auction.seller).transfer(auction.highestBid);

            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids - return NFT to seller
            _transfer(address(this), auction.seller, tokenId);

            emit AuctionEnded(tokenId, address(0), 0);
        }

        delete auctions[tokenId];
    }

    // ------------------------------------------------------------

    /**
     * @notice Cancel an auction that has NO bids yet.
     *         NFT is returned to the seller.
     */
    function cancelAuction(uint256 tokenId) public nonReentrant {
        Auction storage auction = auctions[tokenId];

        require(auction.seller != address(0), "Auction not found");
        require(auction.seller == msg.sender, "Not seller");
        require(auction.active, "Already ended");
        require(auction.highestBid == 0, "Cannot cancel after bids placed");

        auction.active = false;

        _transfer(address(this), auction.seller, tokenId);

        delete auctions[tokenId];

        emit AuctionCancelled(tokenId);
    }

    // ------------------------------------------------------------

    function fetchAuctions() public view returns (Auction[] memory) {
        uint256 total = _tokenIds;
        uint256 count = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (auctions[i].active) {
                count++;
            }
        }

        Auction[] memory items = new Auction[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (auctions[i].active) {
                items[index] = auctions[i];
                index++;
            }
        }

        return items;
    }

    // ------------------------------------------------------------

    function getBidHistory(uint256 tokenId) public view returns (Bid[] memory) {
        return bidHistory[tokenId];
    }

    // ------------------------------------------------------------

    /**
     * @notice Withdraw your outbid ETH that is pending return.
     */
    function withdraw() public nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingReturns[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Withdraw failed");

        emit Refund(msg.sender, amount);
    }

    // ------------------------------------------------------------

    /**
     * @notice Withdraw accumulated listing fees (owner only).
     */
    function withdrawMarketplaceFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner).call{ value: balance }("");
        require(success, "Fee withdrawal failed");
    }

    // ------------------------------------------------------------

    receive() external payable {}
}
