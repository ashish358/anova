import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
//INTERNAL IMPORT
import { Button, Category, Brand } from "../components/componentsindex";
import NFTDetailsPage from "../NFTDetailsPage/NFTDetailsPage";
import { NFTMarketPlaceContext } from "../context/NFTMarketPlaceContext"; 

const NFTDetails = () => {

  const { currentAccount } = useContext(NFTMarketPlaceContext)
  const {} = useContext(NFTMarketPlaceContext);

  const [nft, setNft] = useState({
    image: "",
    tokenId: "",
    name: "",
    owner: "",
    price: "",
    seller: "",

  })

  const router = useRouter();
  useEffect(()=> {
    if (!router.isReady) return 
      setNft(router.query) 
  },[router.isReady])
  return (
    <div>
      <NFTDetailsPage nft={nft} />
      <Category />
      <Brand />
    </div>
  );
};

export default NFTDetails;
