import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

// INTERNAL IMPORT
import { Category, Brand } from "../components/componentsindex";
import NFTDetailsPage from "../NFTDetailsPage/NFTDetailsPage";
import { NFTMarketPlaceContext } from "../context/NFTMarketPlaceContext";

const NFTDetails = () => {
  const { currentAccount } = useContext(NFTMarketPlaceContext);

  const router = useRouter();

  const [nft, setNft] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const data = router.query;

    // ❌ If no data (refresh case)
    if (!data || Object.keys(data).length === 0) {
      console.log("No NFT data found in query");
      return;
    }

    // ✅ Clean + normalize data
    const parsedNFT = {
      ...data,
      tokenId: data.tokenId ? Number(data.tokenId) : "",
      price: data.price || "",
      seller: data.seller || "",
      owner: data.owner || "",
      name: data.name || "",
      description: data.description || "",
      image: data.image || "",
      type: data.type || "fixed",

      // 🔥 IMPORTANT
      endTime: data.endTime ? Number(data.endTime) : 0,
    };

    console.log("Parsed NFT:", parsedNFT);

    setNft(parsedNFT);
  }, [router.isReady]);

  // ⛔ Prevent crash before data loads
  if (!nft) {
    return <p style={{ textAlign: "center" }}>Loading NFT...</p>;
  }

  return (
    <div>
      <NFTDetailsPage nft={nft} />
      <Category />
      <Brand />
    </div>
  );
};

export default NFTDetails;