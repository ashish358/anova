import React, { useState, useEffect, useCallback, useContext } from "react";
import Image from "next/image";
import { AiFillFire, AiFillHeart } from "react-icons/ai";
import { MdVerified, MdTimer } from "react-icons/md";
import { TbArrowBigLeftLines, TbArrowBigRightLine } from "react-icons/tb";
import { useRouter } from "next/router";

// INTERNAL IMPORT
import Style from "./BigNFTSilder.module.css";
import images from "../../img";
import Button from "../Button/Button";
import { NFTMarketPlaceContext } from "../../context/NFTMarketPlaceContext";

const BigNFTSilder = () => {
  const router = useRouter();
  const { fetchAuctionNFTs } = useContext(NFTMarketPlaceContext);

  const [idNumber, setIdNumber] = useState(0);
  const [auctionNFTs, setAuctionNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  // null = timer not calculated yet — prevents false isEnded on first render
  const [timeLeft, setTimeLeft] = useState(null);

  // LOAD AUCTION NFTs
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAuctionNFTs();
        console.log("BigNFTSlider fetched:", data);
        setAuctionNFTs(data || []);
      } catch (err) {
        console.error("BigNFTSlider fetch error:", err);
        setAuctionNFTs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // LIVE COUNTDOWN — resets on slide change
  useEffect(() => {
    setTimeLeft(null); // Reset so "--" shows while recalculating

    if (!auctionNFTs.length) return;
    const current = auctionNFTs[idNumber];
    if (!current?.endTime) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Number(current.endTime) - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (60 * 60 * 24)),
        hours: Math.floor((diff % (60 * 60 * 24)) / (60 * 60)),
        minutes: Math.floor((diff % (60 * 60)) / 60),
        seconds: Math.floor(diff % 60),
        ended: false,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [auctionNFTs, idNumber]);

  // SLIDER CONTROLS
  const inc = useCallback(() => {
    if (idNumber + 1 < auctionNFTs.length) setIdNumber((n) => n + 1);
  }, [idNumber, auctionNFTs.length]);

  const dec = useCallback(() => {
    if (idNumber > 0) setIdNumber((n) => n - 1);
  }, [idNumber]);

  if (loading) {
    return (
      <div className={Style.bigNFTSlider}>
        <p style={{ textAlign: "center", padding: "60px", fontSize: "18px" }}>
          Loading auctions...
        </p>
      </div>
    );
  }

  if (!auctionNFTs.length) {
    return (
      <div className={Style.bigNFTSlider}>
        <p style={{ textAlign: "center", padding: "60px", fontSize: "18px" }}>
          No active auctions right now.
        </p>
      </div>
    );
  }

  const current = auctionNFTs[idNumber];

  // Only true after timer has calculated AND auction time is up
  const isEnded = timeLeft?.ended === true;

  const shortAddress = current.seller
    ? `${current.seller.slice(0, 6)}...${current.seller.slice(-4)}`
    : "Unknown";

  const goToDetails = (tab = "view") => {
    router.push({
      pathname: "/NFT-details",
      query: {
        tokenId: current.tokenId,
        name: current.name,
        description: current.description,
        image: current.image,
        price: current.price,
        seller: current.seller,
        startingPrice: current.startingPrice,
        highestBid: current.highestBid,
        endTime: current.endTime,
        type: "auction",
        tab,
      },
    });
  };

  return (
    <div className={Style.bigNFTSlider}>
      <div className={Style.bigNFTSlider_box}>

        {/* LEFT */}
        <div className={Style.bigNFTSlider_box_left}>
          <h2>{current.name}</h2>

          <div className={Style.bigNFTSlider_box_left_creator}>
            <div className={Style.bigNFTSlider_box_left_creator_profile}>
              <Image
                className={Style.bigNFTSlider_box_left_creator_profile_img}
                src={images.user1}
                alt="creator"
                width={50}
                height={50}
              />
              <div className={Style.bigNFTSlider_box_left_creator_profile_info}>
                <p>Creator</p>
                <h4>
                  {shortAddress} <span><MdVerified /></span>
                </h4>
              </div>
            </div>

            <div className={Style.bigNFTSlider_box_left_creator_collection}>
              <AiFillFire className={Style.bigNFTSlider_box_left_creator_collection_icon} />
              <div className={Style.bigNFTSlider_box_left_creator_collection_info}>
                <p>Type</p>
                <h4>Auction</h4>
              </div>
            </div>
          </div>

          <div className={Style.bigNFTSlider_box_left_bidding}>
            <div className={Style.bigNFTSlider_box_left_bidding_box}>
              <small>
                {Number(current.highestBid) > 0 ? "Highest Bid" : "Starting Price"}
              </small>
              <p>
                {Number(current.highestBid) > 0
                  ? current.highestBid
                  : current.startingPrice}{" "}
                ETH
              </p>
            </div>

            <p className={Style.bigNFTSlider_box_left_bidding_box_auction}>
              <MdTimer className={Style.bigNFTSlider_box_left_bidding_box_icon} />
              <span>{isEnded ? "Auction Ended" : "Auction ending in"}</span>
            </p>

            {/* COUNTDOWN */}
            <div className={Style.bigNFTSlider_box_left_bidding_box_timer}>
              {timeLeft === null
                ? ["Days", "Hours", "Mins", "Secs"].map((label) => (
                    <div
                      key={label}
                      className={Style.bigNFTSlider_box_left_bidding_box_timer_item}
                    >
                      <p>--</p>
                      <span>{label}</span>
                    </div>
                  ))
                : [
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hours" },
                    { value: timeLeft.minutes, label: "Mins" },
                    { value: timeLeft.seconds, label: "Secs" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className={Style.bigNFTSlider_box_left_bidding_box_timer_item}
                    >
                      <p style={{ color: isEnded ? "red" : "inherit" }}>
                        {String(value).padStart(2, "0")}
                      </p>
                      <span>{label}</span>
                    </div>
                  ))}
            </div>

            <div className={Style.bigNFTSlider_box_left_button}>
              <div onClick={() => goToDetails("bid")}>
                <Button btnName="Place Bid" handleClick={() => {}} />
              </div>
              <div onClick={() => goToDetails("view")}>
                <Button btnName="View" handleClick={() => {}} />
              </div>
            </div>
          </div>

          <div className={Style.bigNFTSlider_box_left_sliderBtn}>
            <TbArrowBigLeftLines
              className={Style.bigNFTSlider_box_left_sliderBtn_icon}
              onClick={dec}
              style={{
                opacity: idNumber === 0 ? 0.3 : 1,
                cursor: idNumber === 0 ? "not-allowed" : "pointer",
              }}
            />
            <TbArrowBigRightLine
              className={Style.bigNFTSlider_box_left_sliderBtn_icon}
              onClick={inc}
              style={{
                opacity: idNumber === auctionNFTs.length - 1 ? 0.3 : 1,
                cursor: idNumber === auctionNFTs.length - 1 ? "not-allowed" : "pointer",
              }}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className={Style.bigNFTSlider_box_right}>
          <div className={Style.bigNFTSlider_box_right_box}>
            <Image
              src={current.image}
              alt={current.name}
              width={700}
              height={700}
              className={Style.bigNFTSlider_box_right_box_img}
              unoptimized
            />
            <div className={Style.bigNFTSlider_box_right_box_like}>
              <AiFillHeart />
              <span>{idNumber + 1} / {auctionNFTs.length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BigNFTSilder;