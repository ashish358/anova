import React, { useContext, useEffect, useState } from "react";

// INTERNAL IMPORT
import Style from "../styles/searchPage.module.css";
import { Slider, Brand } from "../components/componentsindex";
import { SearchBar } from "../SearchPage/searchBarIndex";
import { Filter } from "../components/componentsindex";
import { NFTCardTwo, Banner } from "../collectionPage/collectionIndex";
import images from "../img";
import { NFTMarketPlaceContext } from "../context/NFTMarketPlaceContext";

const searchPage = () => {
  const { fetchAuctionNFTs, fetchNFT } = useContext(NFTMarketPlaceContext);

  const [nfts, setNfts] = useState([]);
  const [nftCopy, setNftCopy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNFTs = async () => {
      try {
        setLoading(true);

        // Load both auction AND fixed-price NFTs in parallel
        const [auctionNFTs, fixedNFTs] = await Promise.all([
          fetchAuctionNFTs().catch((e) => {
            console.error("fetchAuctionNFTs error:", e);
            return [];
          }),
          fetchNFT().catch((e) => {
            console.error("fetchNFT error:", e);
            return [];
          }),
        ]);

        console.log("Auction NFTs:", auctionNFTs);
        console.log("Fixed NFTs:", fixedNFTs);

        // Merge: auctions first, then fixed-price, newest first
        const all = [...auctionNFTs, ...fixedNFTs].reverse();

        setNfts(all);
        setNftCopy(all);
      } catch (error) {
        console.error("Error loading NFTs:", error);
        setNfts([]);
        setNftCopy([]);
      } finally {
        setLoading(false);
      }
    };

    loadNFTs();
  }, []);

  const onHandlerSearch = (value) => {
    if (!value.trim()) {
      setNfts(nftCopy);
      return;
    }

    const filteredNFTs = nftCopy.filter((nft) =>
      nft.name?.toLowerCase().includes(value.toLowerCase())
    );

    setNfts(filteredNFTs.length > 0 ? filteredNFTs : nftCopy);
  };

  const onClearSearch = () => {
    setNfts(nftCopy);
  };

  return (
    <div className={Style.searchPage}>
      <Banner bannerImage={images.creatorbackground2} />
      <SearchBar
        onHandlerSearch={onHandlerSearch}
        onClearSearch={onClearSearch}
      />
      <Filter />

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px", fontSize: "18px" }}>
          Loading NFTs...
        </p>
      ) : nfts.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px", fontSize: "18px" }}>
          No NFTs listed yet.
        </p>
      ) : (
        <NFTCardTwo NFTData={nfts} />
      )}

      <Slider />
      <Brand />
    </div>
  );
};

export default searchPage;