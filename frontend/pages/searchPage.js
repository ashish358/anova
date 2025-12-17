import React, { useContext, useEffect, useState } from "react";

//INTRNAL IMPORT
import Style from "../styles/searchPage.module.css";
import { Slider, Brand } from "../components/componentsindex";
import { SearchBar } from "../SearchPage/searchBarIndex";
import { Filter } from "../components/componentsindex";

import { NFTCardTwo, Banner } from "../collectionPage/collectionIndex";
import images from "../img";

import { NFTMarketPlaceContext } from "../context/NFTMarketPlaceContext"; 


const searchPage = () => {
  

  const {fetchNFT} = useContext(NFTMarketPlaceContext);
  const [nfts,setNfts] = useState([]);
  const [nftCopy, setNftCopy] = useState([]);

useEffect(() => {
  const loadNFTs = async () => {
    const items = await fetchNFT();

    if (Array.isArray(items)) {
      setNfts([...items].reverse()); // safe reverse
      setNftCopy(items);
      console.log(nfts);
    } else {
      setNfts([]);
      setNftCopy([]);
    }
  };

  loadNFTs();
}, [fetchNFT]); // ✅ dependency array added


  // const collectionArray = [
  //   images.nft_image_1,
  //   images.nft_image_2,
  //   images.nft_image_3,
  //   images.nft_image_1,
  //   images.nft_image_2,
  //   images.nft_image_3,
  //   images.nft_image_1,
  //   images.nft_image_2,
  // ];

  const onHandlerSearch = (value) => {
    // const filteredNFTS = nfts.filter(({ name }) => {
    //   name.toLowerCase().includes(value.toLowerCase())
    // });

    const filteredNFTS = nftCopy.filter(({ name }) =>
  name.toLowerCase().includes(value.toLowerCase())
);

    if(filteredNFTS.length === 0){
      setNfts(nftCopy);
    }
    else{
      setNfts(filteredNFTS);
    }
  };

  const onClearSearch = ()=> {
    if(nfts.length && nftCopy.length){
      setNfts(nftCopy)
    }
  }

  return (
    <div className={Style.searchPage}>
      <Banner bannerImage={images.creatorbackground2} />
      {/* <SearchBar onHandlerSearch={images.onHandlerSearch} onClearSearch={onClearSearch} /> */}
      <SearchBar onHandlerSearch={onHandlerSearch} onClearSearch={onClearSearch} />
      <Filter />
      <NFTCardTwo NFTData={nfts} />
      <Slider />
      <Brand />
    </div>
  );
};

export default searchPage;
