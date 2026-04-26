// context/NFTMarketPlaceContext.js
import React, { createContext, useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Router from "next/router";
import axios from "axios";
import { useRouter } from "next/router";

import { NFTMarketplaceABI, NFTMarketPlaceAddress } from "./constant";

export const NFTMarketPlaceContext = createContext();

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(NFTMarketPlaceAddress, NFTMarketplaceABI, signerOrProvider);

// Read-only provider - works without wallet connected
const getReadOnlyContract = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return fetchContract(provider);
  }
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
  );
  return fetchContract(provider);
};

// Signer-based contract - requires wallet
const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.BrowserProvider(connection);
    const signer = await provider.getSigner();
    return fetchContract(signer);
  } catch (error) {
    console.error("Error connecting with contract:", error);
    return null;
  }
};

export const NFTMarketPlaceProvider = ({ children }) => {
  const titleData = "Discover, collect, and sell NFTs";
  const [currentAccount, setCurrentAccount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  // WALLET
  const checkIfWalletConnected = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) return;
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      setCurrentAccount(accounts.length > 0 ? accounts[0] : "");
    } catch (error) {
      console.error("Wallet restore failed:", error);
    }
  };

  useEffect(() => {
    checkIfWalletConnected();
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setCurrentAccount(accounts.length > 0 ? accounts[0] : "");
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) setUserEmail(storedEmail);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return console.log("Install MetaMask");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // PINATA UPLOAD
  const uploadToIPFS = async (file) => {
    try {
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
          },
        }
      );
      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
    }
  };

  // CREATE NFT
  const createNFT = async (name, price, image, description, router, saleType, duration) => {
    if (!name || !description || !price || !image) return console.log("Data is missing");
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        { name, description, image },
        {
          headers: {
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
          },
        }
      );
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
      await createSale(tokenURI, price, saleType, duration);
      axios
        .post("/api/send-mail", { nftName: name, creatorAddress: currentAccount })
        .catch((e) => console.warn("Email notification failed:", e));
      Router.push("/searchPage");
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  };

  // CREATE SALE - mint then list
  const createSale = async (tokenURI, price, saleType = "fixed", duration = 0) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) throw new Error("Contract not available");

      // STEP 1: MINT
      const mintTx = await contract.mintNFT(tokenURI);
      const receipt = await mintTx.wait();

      const event = receipt.logs
        .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e) => e && e.name === "Transfer");

      if (!event) throw new Error("Transfer event not found in mint receipt");
      const tokenId = event.args.tokenId;
      console.log("Minted tokenId:", tokenId.toString());

      const parsedPrice = ethers.parseEther(price.toString());
      const listingPrice = await contract.listingPrice();

      // STEP 2: LIST
      if (saleType === "auction") {
        const durationInSec = Number(duration);
        if (!durationInSec || durationInSec <= 0) throw new Error("Invalid auction duration");
        const tx = await contract.createAuction(tokenId, parsedPrice, durationInSec, { value: listingPrice });
        await tx.wait();
        console.log("Auction created");
      } else {
        const tx = await contract.listItem(tokenId, parsedPrice, { value: listingPrice });
        await tx.wait();
        console.log("Fixed-price listing created");
      }
    } catch (error) {
      console.error("createSale error:", error);
      throw error;
    }
  };

  // FETCH AUCTION NFTs
  const fetchAuctionNFTs = async () => {
    try {
      const contract = getReadOnlyContract();
      const data = await contract.fetchAuctions();
      const items = await Promise.all(
        data.map(async (item) => {
          try {
            const tokenURI = await contract.tokenURI(item.tokenId);
            const meta = await axios.get(tokenURI);
            return {
              tokenId: Number(item.tokenId),
              seller: item.seller,
              price: item.highestBid > 0n
                ? ethers.formatEther(item.highestBid)
                : ethers.formatEther(item.startingPrice),
              highestBid: ethers.formatEther(item.highestBid),
              startingPrice: ethers.formatEther(item.startingPrice),
              endTime: Number(item.endTime),
              image: meta.data.image,
              name: meta.data.name,
              description: meta.data.description,
              type: "auction",
            };
          } catch (err) {
            console.error("Error mapping auction item:", err);
            return null;
          }
        })
      );
      return items.filter(Boolean);
    } catch (error) {
      console.error("fetchAuctionNFTs error:", error);
      return [];
    }
  };

  // FETCH FIXED-PRICE NFTs
  const fetchNFT = async () => {
    try {
      const contract = getReadOnlyContract();
      const data = await contract.fetchMarketItems();
      const items = await Promise.all(
        data.map(async (item) => {
          try {
            const tokenURI = await contract.tokenURI(item.tokenId);
            const meta = await axios.get(tokenURI);
            return {
              tokenId: Number(item.tokenId),
              seller: item.seller,
              owner: item.owner,
              price: ethers.formatEther(item.price),
              image: meta.data.image,
              name: meta.data.name,
              description: meta.data.description,
              tokenURI,
              type: "fixed",
            };
          } catch (err) {
            console.error("Error mapping fixed NFT:", err);
            return null;
          }
        })
      );
      return items.filter(Boolean);
    } catch (error) {
      console.error("fetchNFT error:", error);
      return [];
    }
  };

  // Helper: resolve MarketItem[] to metadata
  const resolveItems = async (contract, data) => {
    const results = await Promise.all(
      data.map(async (item) => {
        try {
          const tokenURI = await contract.tokenURI(item.tokenId);
          const meta = await axios.get(tokenURI);
          return {
            tokenId: Number(item.tokenId),
            seller: item.seller,
            owner: item.owner,
            price: ethers.formatEther(item.price),
            image: meta.data.image,
            name: meta.data.name,
            description: meta.data.description,
            tokenURI,
            type: "fixed",
          };
        } catch (err) {
          console.error("Error resolving item:", err);
          return null;
        }
      })
    );
    return results.filter(Boolean);
  };

  // FETCH MY NFTs - includes auction wins via ERC721 ownership scan
  const fetchMyNFTsOrListedNFTs = async (type) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return [];

      if (type === "fetchItemsListed") {
        const data = await contract.fetchMarketItems();
        return resolveItems(contract, data);
      }

      if (type === "fetchItemsCreated") {
        const data = await contract.fetchItemsCreated();
        return resolveItems(contract, data);
      }

      if (type === "fetchMyNFTs") {
        const signerAddress = await contract.runner.getAddress();

        // 1. Market items owned by user
        const marketData = await contract.fetchMyNFTs();
        const marketItems = await resolveItems(contract, marketData);
        const marketTokenIds = new Set(marketItems.map((i) => i.tokenId));

        // 2. Scan all ERC721 tokens for auction wins (tokens directly owned)
        const auctionWins = [];
        let tokenId = 1;

        while (true) {
          try {
            const ownerAddr = await contract.ownerOf(tokenId);
            if (ownerAddr.toLowerCase() === signerAddress.toLowerCase()) {
              if (!marketTokenIds.has(tokenId)) {
                try {
                  const tokenURI = await contract.tokenURI(tokenId);
                  const meta = await axios.get(tokenURI);
                  auctionWins.push({
                    tokenId,
                    seller: "",
                    owner: signerAddress,
                    price: "0",
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                    tokenURI,
                    type: "owned",
                  });
                } catch (metaErr) {
                  console.error("Meta error for token", tokenId, metaErr);
                }
              }
            }
            tokenId++;
          } catch {
            // ownerOf reverted = no more tokens minted
            break;
          }
        }

        return [...marketItems, ...auctionWins];
      }

      return [];
    } catch (error) {
      console.error("fetchMyNFTsOrListedNFTs error:", error);
      return [];
    }
  };

  // BUY NFT
  const buyNFT = async (nft) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return;
      const price = ethers.parseEther(nft.price.toString());
      const tx = await contract.createMarketSale(nft.tokenId, { value: price });
      await tx.wait();
      router.push("/author");
    } catch (error) {
      console.error("Error buying NFT:", error);
      throw error;
    }
  };

  // RESELL
  const resellNFT = async (tokenId, price) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return;
      const listingPrice = await contract.listingPrice();
      const parsedPrice = ethers.parseEther(price.toString());
      const tx = await contract.listItem(tokenId, parsedPrice, { value: listingPrice });
      await tx.wait();
      console.log("NFT relisted");
    } catch (error) {
      console.error("Resell error:", error);
      throw error;
    }
  };

  // AUCTION ACTIONS
  const bidNFT = async (tokenId, bidAmount) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return;
      const price = ethers.parseEther(bidAmount.toString());
      const tx = await contract.placeBid(tokenId, { value: price });
      await tx.wait();
      console.log("Bid placed");
    } catch (error) {
      console.error("Bid error:", error);
      throw error;
    }
  };

  const getBidHistory = async (tokenId) => {
    try {
      const contract = getReadOnlyContract();
      const data = await contract.getBidHistory(tokenId);
      return data.map((bid) => ({
        bidder: bid.bidder,
        amount: ethers.formatEther(bid.amount),
      }));
    } catch (err) {
      console.error("getBidHistory error:", err);
      return [];
    }
  };

  const endAuction = async (tokenId) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return;
      const tx = await contract.endAuction(tokenId);
      await tx.wait();
      console.log("Auction ended");
    } catch (error) {
      console.error("End auction error:", error);
      throw error;
    }
  };

  const cancelAuction = async (tokenId) => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return;
      const tx = await contract.cancelAuction(tokenId);
      await tx.wait();
      console.log("Auction cancelled");
    } catch (error) {
      console.error("Cancel auction error:", error);
      throw error;
    }
  };

  // WITHDRAW OUTBID ETH
  const withdrawFunds = async () => {
    try {
      const contract = await connectingWithSmartContract();
      if (!contract) return;
      const tx = await contract.withdraw();
      await tx.wait();
      console.log("Funds withdrawn");
    } catch (error) {
      console.error("Withdraw error:", error);
      throw error;
    }
  };

  const checkContract = async () => {
    const contract = await connectingWithSmartContract();
    if (!contract) { console.warn("No contract."); return; }
    console.log("Contract:", contract);
  };

  return (
    <NFTMarketPlaceContext.Provider
      value={{
        titleData,
        connectWallet,
        uploadToIPFS,
        createNFT,
        createSale,
        fetchNFT,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        resellNFT,
        currentAccount,
        checkIfWalletConnected,
        userEmail,
        setUserEmail,
        fetchAuctionNFTs,
        bidNFT,
        getBidHistory,
        endAuction,
        cancelAuction,
        withdrawFunds,
        checkContract,
      }}
    >
      {children}
    </NFTMarketPlaceContext.Provider>
  );
};