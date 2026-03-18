// context/NFTMarketPlaceContext.js
import React, { createContext, useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Router from "next/router";
import axios from "axios";
import {create as ipfsHttpClient } from "ipfs-http-client"

import { useRouter } from "next/router";
// const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

// const projectId = "your porjec id here"
// const projectSecretKey = "project secretkey here"
// const auth = `Basic ${Buffer.from(`${projectId}:${projectSecretKey}`).toString("base64")}`;

// const subdomain = "yor subdomain"

// const client = ipfsHttpClient({
//   host: "infura-ipfs.io",
//   port: 5001,
//   protocol: "https",
//   headers: {
//     authorizaton: auth,
//   }
// })


// internal imports (make sure the paths & names match)
import { NFTMarketplaceABI, NFTMarketPlaceAddress } from "./constant";

export const NFTMarketPlaceContext = createContext();

// fetch contract for ethers v6: (address, abi, signerOrProvider)
const fetchContract = (signerOrProvider) =>
  new ethers.Contract(NFTMarketPlaceAddress, NFTMarketplaceABI, signerOrProvider);

// connect using ethers v6
const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect(); // e.g., window.ethereum

    // ethers v6: BrowserProvider wraps an external provider
    // if connection is already a provider-like object, BrowserProvider will accept it
    const provider = new ethers.BrowserProvider(connection);

    // BrowserProvider.getSigner() returns a Signer instance (not a Promise)
    const signer = await provider.getSigner();

    const contract = fetchContract(signer);
    return contract;
  } catch (error) {
    console.error("Something went wrong while connecting with contract:", error);
    return null;
  }
};

export const NFTMarketPlaceProvider = ({ children }) => {
  const titleData = "Discover, collect, and sell NFTs";

  const checkContract = async () => {
    const contract = await connectingWithSmartContract();
    if (!contract) {
      console.warn("No contract available (check wallet connection).");
      return;
    }
    console.log("Contract loaded:", contract);
  };

// Userstate
  const [currentAccount, setCurrentAccount] = useState("");
  const router = useRouter();

  // const checkIfWalletConnected = async () => {
  //   try {
  //     if (!window.ethereum) return console.log("install metamask");

  //   //   const accounts = await window.ethereum.request({method: "eth_accounts",});
      

  //   const accounts = await window.ethereum.request({
  //     method: "eth_accounts",
  //   });
  //     if (accounts.length) {
  //       setCurrentAccount(accounts[0])
  //     }
  //     else{
  //       console.log("no account found");
        
  //     }
  //     console.log(currentAccount);
      
  //   } catch (error) {
  //     console.log("Something worng while conneting to wallet");
      
  //   }
  // }

  // useEffect(() => {
  //   checkIfWalletConnected();
  // },[]);

  const checkIfWalletConnected = async () => {
  try {
    if (typeof window === "undefined") return;
    if (!window.ethereum) return;

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length > 0) {
      setCurrentAccount(accounts[0]);
      console.log("Wallet restored:", accounts[0]);
    } else {
      setCurrentAccount("");
    }
  } catch (error) {
    console.error("Wallet restore failed:", error);
  }
};

  useEffect(() => {
  checkIfWalletConnected();

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        setCurrentAccount("");
      }
    });
  }
}, []);


//   connet wallet fn

  const connectWallet = async () => {
    try {
        if (!window.ethereum) return console.log("install metamask");

        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        setCurrentAccount(accounts[0]);
        // window.location.reload(); 
    } catch (error) {
        console.log("error while conneting to wallet");
        
    }
  }

//   upload to ipfs funtion
  // const uploadToIPFS = async (file) => {
  //   try {
  //       const added = await client.add({ content: file});
  //       const url = `${subdomain}/ipfs/${added.path}`;
  //       return url;

  //   } catch (error) {
        
  //       console.log("error uploading to ipfs", (error));
        
  //   }
  // }

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

    const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    return url;
  } catch (error) {
    console.error("error uploading file to Pinata:", error);
  }
};


// create nft fn

// const createNFT = async (formInput, fileUrl, router) => {

//         const {name, description, price} = formInput;

//         if(!name || !description || !price || !fileUrl)
//             return console.log("data is missing");

//         const data = JSON.stringify({name, description, image: fileUrl})

//         try {
//             const added = await client.add(data);
//             const url = `https://ipfs.infura.io/ipfs/${added.path}`

//             await createSale(url, price);
//         } catch (error) {
//         console.log("error while creating NFT");                   
//         }

// }

const createNFT = async (name, price, image ,description, router) => {
  // const { name, description, price } = formInput;

  if (!name || !description || !price || !image ) {
    return console.log("Data is missing");
  }

  const metadata = {
    name,
    description,
    image,
  };

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
        },
      }
    );

    const tokenURI = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    await createSale(tokenURI, price, router);
    Router.push("/searchPage");

    console.log({
  name,
  description,
  price,
  image,
});

  } catch (error) {
    console.error("error creating NFT:", error);
  }
};


// createSale fun

const createSale = async (tokenURI, price) => {
  try {
    if (!tokenURI || !price) {
      throw new Error("Missing tokenURI or price");
    }

    const contract = await connectingWithSmartContract();

    const listingPrice = await contract.getListingPrice();
    const parsedPrice = ethers.parseEther(price.toString());

    const tx = await contract.createToken(
      tokenURI,
      parsedPrice,
      { value: listingPrice }
    );

    await tx.wait();
    console.log("NFT minted & listed ✅");


  // //////////
  // const contract = await connectingWithSmartContract();

const provider = contract.runner.provider;
const code = await provider.getCode(NFTMarketPlaceAddress);

console.log("Address:", NFTMarketPlaceAddress);
console.log("Contract code:", code);
// const contract = await connectingWithSmartContract();

// const provider = contract.runner.provider;

const network = await provider.getNetwork();
console.log("Connected Network:", network);

// const code = await provider.getCode(NFTMarketPlaceAddress);
console.log("Contract Code:", code);



  } catch (error) {
    console.error("❌ createSale error:", error);
    throw error;
  }
};

const resellNFT = async (tokenId, price) => {
  try {
    const contract = await connectingWithSmartContract();

    const listingPrice = await contract.getListingPrice();
    const parsedPrice = ethers.parseEther(price.toString());

    const tx = await contract.resellToken(
      tokenId,
      parsedPrice,
      { value: listingPrice }
    );

    await tx.wait();
    console.log("NFT relisted ✅");

  } catch (error) {
    console.error("❌ resell error:", error);
    throw error;
  }
};


// const createSale = async (url, formInputPrice, isReselling = false, id = null) => {
//   try {
//     if (!formInputPrice || !url) {
//       throw new Error("Missing data");
//     }

//     // ✅ ethers v6
//     const price = ethers.parseUnits(formInputPrice.toString(), "ether");

//     const contract = await connectingWithSmartContract();

//     const listingPrice = await contract.getListingPrice();

//     let tx;

//     if (!isReselling) {
//       // ✅ Mint + list
//       tx = await contract.createToken(url, price, {
//         value: listingPrice,
//       });
//     } else {
//       // ✅ Resell existing NFT
//       tx = await contract.resellToken(id, price, {
//         value: listingPrice,
//       });
//     }

//     console.log("Transaction sent:", tx.hash);
//     await tx.wait();
//     console.log("Transaction confirmed ✅");

//   } catch (error) {
//     console.error("❌ error while creating sale:", error);
//     throw error;
//   }
// };


// const createSale = async (url, formInputPrice, isReselling, id) => {
//     try {
//         const price = ethers.parseUnits(formInputPrice, "ether");
//         const conctract = await connectingWithSmartContract()

//         const listingPirce = await conctract.getListingPrice();

//         const transaction = !isReselling ? await contract.createToken(url, price, {
//             value: listingPirce.toString(),
//         })
//         : await contract.resellToken(id, price, {
//             value: listingPirce.toString(),
//         });

//         await transaction.wait();
//     } catch (error) {
//         console.log("error while creating sale");
        
//     }
// }

// const createSale = async (tokenURI, price) => {
//   try {
//     console.log("Creating sale...");
//     console.log("TokenURI:", tokenURI);
//     console.log("Price:", price);

//     const contract = await connectingWithSmartContract();
//     console.log("Contract:", contract);

//     const listingPrice = await contract.getListingPrice();
//     console.log("Listing Price:", listingPrice.toString());

//     const parsedPrice = ethers.parseUnits(price.toString(), "ether");

//     const tx = await contract.createToken(
//       tokenURI,
//       parsedPrice,
//       { value: listingPrice }
//     );

//     const transaction = !isReselling ? await contract.createToken(url, price, {
//       value: listingPrice.toString(),
//     })
//     : await contract.resellTO


//     console.log("Transaction sent:", tx.hash);

//     await tx.wait();
//     console.log("Transaction confirmed");


//   } catch (error) {
//     console.error("FULL ERROR:", error);
//   }
// };


// fetch nft fun

// const fetchNFT = async () => {
//     try {
//         // const provider = new ethers.provider.JsonRpcProvider();
//         const provider = new ethers.JsonRpcProvider();

//         const contract = fetchContract(provider);

//         const data = await contract.fetchMarketItems();
//         // console.log(data);
        
//         const items = await Promise.all(
//             data.map(
//             async({ tokenId, seller, owner, price, unformattedPrice }) => {
//                 const tokenURI = await contract.tokenURI(tokenId);
            
//             const { data: { image, name, description},} = await axios.get(tokenURI);
            
//             price = ethers.utils.formatUnits(unformattedPrice.toString(), "ether");
            
//             return {
//                 price,
//                 tokenId: tokenId.toNumber(),
//                 seller,
//                 owner,
//                 image,
//                 name,
//                 description,
//                 tokenURI,
//             };
            
//             }
//         )    


//         );
//         return items;
//     } catch (error) {
//         console.log("error while fetching NFTs");
        
//     }
// }


const fetchNFT = async () => {
  try {
    // ✅ ethers v6 provider
    const provider = new ethers.JsonRpcProvider();

    const contract = fetchContract(provider);

    const data = await contract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (item) => {
        const tokenURI = await contract.tokenURI(item.tokenId);

        const meta = await axios.get(tokenURI);

        return {
          tokenId: Number(item.tokenId),
          seller: item.seller,
          owner: item.owner,
          price: ethers.formatUnits(item.price, "ether"),
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
          tokenURI,
        };
      })
    );

    return items;
  } catch (error) {
    console.error("❌ error while fetching NFTs:", error);
    return [];
  }
};
// const fetchNFT = async () => {
//   try {
//     if (!window.ethereum) return [];

//     const provider = new ethers.BrowserProvider(window.ethereum);
//     const contract = fetchContract(provider);

//     const data = await contract.fetchMarketItems();

//     const items = await Promise.all(
//       data.map(async (item) => {
//         const tokenURI = await contract.tokenURI(item.tokenId);
//         const meta = await axios.get(tokenURI);

//         return {
//           tokenId: Number(item.tokenId),
//           seller: item.seller,
//           owner: item.owner,
//           price: ethers.formatUnits(item.price, "ether"),
//           image: meta.data.image,
//           name: meta.data.name,
//           description: meta.data.description,
//           tokenURI,
//         };
//       })
//     );

//     console.log("Fetched items:", items);

//     return items;
//   } catch (error) {
//     console.error("❌ error while fetching NFTs:", error);
//     return [];
//   }
// };

// const [nfts, setNFTs] = useState([]);
// useEffect(() => {
//   const loadNFTs = async () => {
//     const items = await fetchNFT();
//     setNFTs(items);
//   };

//   loadNFTs();
// }, []);


useEffect(()=> {
  fetchNFT();
},[])
// fetching my nft or listed nfts

// const fetchMyNFTsOrListedNFTs = async(type) => {
//     try {
//         const contract = await connectingWithSmartContract();
        
//         const data = type == "fetchItemsListed" ? await contract.fetchItemsListed() : await contract.fetchMyNFTs()
        
//         const items = await Promise.all(
//             data.map(
//                 async ({ tokenId, seller, owner, price: unformattedPrice }) => {
//                     const tokenURI = await contract.tokenURI(tokenId);
//                     const {
//                         data: { image, name , description},
                        
//                     } = await axios.get(tokenURI);
//                      price = ethers.utils.formatUnits(
//                         unformattedPrice.toString(),
//                         "ether"
//                     );
//                     return {
//                        price,
//                        tokenId: tokenId.toNumber(),
//                        seller,
//                        owner,
//                        image,
//                        name,
//                        description,
//                        tokenURI, 
//                     }
//                 }
//             )
//         )
//         return items;
//     } catch (error) {
//         console.log("error while fetching listed NFTs");
        
//     }
// }

const fetchMyNFTsOrListedNFTs = async (type) => {
    try {
      const contract = await connectingWithSmartContract();
      let data;

      if (type === "fetchMyNFTs") data = await contract.fetchMyNFTs();
      else if (type === "fetchItemsListed")
        data = await contract.fetchItemsListed();
      else if (type === "fetchItemsCreated")
        data = await contract.fetchItemsCreated();
      else return [];

      return Promise.all(
        data.map(async (item) => {
          const tokenURI = await contract.tokenURI(item.tokenId);
          const meta = await axios.get(tokenURI);

          return {
            tokenId: Number(item.tokenId),
            seller: item.seller,
            owner: item.owner,
            price: ethers.formatUnits(item.price, "ether"),
            image: meta.data.image,
            name: meta.data.name,
            description: meta.data.description,
            tokenURI,
          };
        })
      );
    } catch {
      return [];
    }
  };

    useEffect(()=> {
      fetchMyNFTsOrListedNFTs();
    }, []);
  
    
// Buy nfts function

const buyNFT = async (nft) =>{
    try {
        const contract = await connectingWithSmartContract();
        // const price = ethers.utils.parseUnits(nft.price.toString(),"ether");
         const price = ethers.parseEther(nft.price.toString());

        const transaction = await contract.createMarketSale(nft.tokenId,{
            value:price,
        });

        await transaction.wait();
        router.push("/author");
    } catch (error) {
        console.log("error while buying NFT");
        
    }
}

  return (
    <NFTMarketPlaceContext.Provider
      value={{ titleData  , connectWallet, uploadToIPFS, createNFT, fetchNFT, fetchMyNFTsOrListedNFTs, buyNFT,currentAccount, checkIfWalletConnected, createSale, resellNFT }}
    >
      {children}
    </NFTMarketPlaceContext.Provider>
  );
};
