import React, { useEffect, useState,useContext } from "react";

//INTERNAL IMPORT
import Style from "../styles/index.module.css";
import {
  HeroSection,
  Service,
  BigNFTSilder,
  Subscribe,
  Title,
  Category,
  Filter,
  NFTCard,
  Collection,
  AudioLive,
  FollowerTab,
  Slider,
  Brand,
  Video,
} from "../components/componentsindex";

import { getTopCreators } from "../TopCreator/TopCreator"

import { NFTMarketPlaceContext } from "../context/NFTMarketPlaceContext"; 

const Home = () => {

  const { checkIfWalletConnected } = React.useContext(NFTMarketPlaceContext); 

  useEffect(()=> {
    checkIfWalletConnected();
  }, []);


    const {fetchNFT} = useContext(NFTMarketPlaceContext);
    const [nfts,setNfts] = useState([]);
    const [nftCopy, setNftCopy] = useState([]);

    // creator list
    const creators = getTopCreators(nfts)

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
  }, [fetchNFT]);
  



  return (
    <div className={Style.homePage}>
      <HeroSection />
      <Service />
      <BigNFTSilder />
      <Title
        heading="Audio Collection"
        paragraph="Discover the most outstanding NFTs in all topics of life."
      />
      <AudioLive />
      <FollowerTab TopCreator={creators}/>
      <Slider />
      <Collection />
      <Title
        heading="Featured NFTs"
        paragraph="Discover the most outstanding NFTs in all topics of life."
      />
      <Filter />
      <NFTCard NFTData={nfts} />
      <Title
        heading="Browse by category"
        paragraph="Explore the NFTs in the most featured categories."
      />
      <Category />
      <Subscribe />
      <Brand />
      {/* <Video /> */}
    </div>
  );
};

export default Home;
