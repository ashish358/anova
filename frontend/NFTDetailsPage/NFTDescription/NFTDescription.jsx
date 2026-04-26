import React, { useContext, useState, useEffect } from "react";
import { MdTimer } from "react-icons/md";
import { useRouter } from "next/router";

import Style from "./NFTDescription.module.css";
import { Button } from "../../components/componentsindex.js";
import { NFTMarketPlaceContext } from "../../context/NFTMarketPlaceContext.js";

const NFTDescription = ({ nft }) => {
  const router = useRouter();

  const [bidAmount, setBidAmount] = useState("");
  const [bidHistory, setBidHistory] = useState([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const {
    buyNFT,
    currentAccount,
    bidNFT,
    getBidHistory,
    endAuction,
    cancelAuction,
    withdrawFunds,
  } = useContext(NFTMarketPlaceContext);

  // ─── ROLE CHECKS ────────────────────────────────────────────────────────────

  const isSeller =
    currentAccount &&
    nft?.seller &&
    currentAccount.toLowerCase() === nft.seller.toLowerCase();

  const isOwner =
    currentAccount &&
    nft?.owner &&
    currentAccount.toLowerCase() === nft.owner.toLowerCase();

  // ─── COUNTDOWN TIMER ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!nft?.endTime) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = nft.endTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsEnded(true);
        return;
      }

      setIsEnded(false);
      setTimeLeft({
        days: Math.floor(diff / (60 * 60 * 24)),
        hours: Math.floor((diff % (60 * 60 * 24)) / (60 * 60)),
        minutes: Math.floor((diff % (60 * 60)) / 60),
        seconds: Math.floor(diff % 60),
      });
    };

    tick(); // Run immediately so no flicker
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nft]);

  // ─── BID HISTORY POLLING ────────────────────────────────────────────────────

  useEffect(() => {
    if (!nft?.tokenId) return;

    const loadBids = async () => {
      const data = await getBidHistory(nft.tokenId);
      setBidHistory(data);

      if (data.length > 0) {
        const highest = Math.max(...data.map((b) => Number(b.amount)));
        setCurrentBid(highest);
      } else {
        // No bids yet — show starting price
        setCurrentBid(Number(nft.startingPrice || nft.price || 0));
      }
    };

    loadBids();
    const interval = setInterval(loadBids, 5000);
    return () => clearInterval(interval);
  }, [nft]);

  // ─── ACTIONS ────────────────────────────────────────────────────────────────

  const handleBid = async () => {
    if (!bidAmount) return alert("Enter a bid amount");

    const minRequired =
      bidHistory.length > 0
        ? currentBid + 0.01   // Must beat current bid by at least 0.01 ETH
        : Number(nft.startingPrice || nft.price || 0);

    if (Number(bidAmount) < minRequired) {
      return alert(
        bidHistory.length > 0
          ? `Bid must be at least ${minRequired.toFixed(4)} ETH (current bid + 0.01 ETH increment)`
          : `Bid must be at least ${minRequired} ETH (starting price)`
      );
    }

    try {
      setLoading(true);
      setActionMsg("Placing bid...");
      await bidNFT(nft.tokenId, bidAmount);
      setBidAmount("");
      setActionMsg("Bid placed successfully! ✅");
    } catch (err) {
      console.error(err);
      setActionMsg("Bid failed ❌ — check console");
    } finally {
      setLoading(false);
    }
  };

  const handleEndAuction = async () => {
    if (!window.confirm("Are you sure you want to end this auction?")) return;
    try {
      setLoading(true);
      setActionMsg("Ending auction...");
      await endAuction(nft.tokenId);
      setActionMsg("Auction ended ✅");
    } catch (err) {
      console.error(err);
      setActionMsg("Failed to end auction ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!window.confirm("Cancel auction? NFT will be returned to you.")) return;
    try {
      setLoading(true);
      setActionMsg("Cancelling auction...");
      await cancelAuction(nft.tokenId);
      setActionMsg("Auction cancelled ✅");
    } catch (err) {
      console.error(err);
      setActionMsg("Failed to cancel auction ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async () => {
    try {
      setLoading(true);
      setActionMsg("Purchasing NFT...");
      await buyNFT(nft);
      setActionMsg("NFT purchased ✅");
    } catch (err) {
      console.error(err);
      setActionMsg("Purchase failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className={Style.NFTDescription}>
      <div className={Style.NFTDescription_box}>
        <div className={Style.NFTDescription_box_profile}>

          {/* NFT Title */}
          <h1>
            {nft?.name} #{nft?.tokenId}
          </h1>

          {/* ── AUCTION INFO ── */}
          {nft?.type === "auction" && (
            <>
              <div className={Style.NFTDescription_box_profile_timer}>
                <MdTimer />
                <span>Auction ending in:</span>
              </div>

              <div className={Style.NFTDescription_box_profile_timer_box}>
                {isEnded ? (
                  <p style={{ color: "red", fontWeight: "bold" }}>
                    🔴 Auction Ended
                  </p>
                ) : (
                  <p>
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
                    {timeLeft.seconds}s
                  </p>
                )}
              </div>

              {isEnded && bidHistory.length > 0 && (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  🏆 Auction over — winner is the highest bidder
                </p>
              )}
            </>
          )}

          {/* ── PRICE / CURRENT BID ── */}
          <div className={Style.NFTDescription_box_profile_biding}>
            <div>
              <small>
                {nft?.type === "auction" ? "Current Bid" : "Price"}
              </small>
              <p>
                {nft?.type === "auction"
                  ? `${currentBid} ETH`
                  : `${nft?.price} ETH`}
              </p>
              {nft?.type === "auction" && (
                <small>Starting Price: {nft?.startingPrice} ETH</small>
              )}
            </div>
          </div>

          {/* ── ACTION SECTION ── */}
          <div className={Style.NFTDescription_box_profile_bidding_box_bid}>

            {nft?.type === "auction" ? (
              <>
                {/* BID INPUT — Only for non-sellers and while auction is live */}
                {!isSeller && !isEnded && (
                  <div>
                    <input className="p4"
                      type="number"
                      placeholder="Enter bid amount (ETH)"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      disabled={loading}
                      min={0}
                      step={0.01}
                    />
                    <Button
                      btnName={loading ? "Placing Bid..." : "Place Bid"}
                      handleClick={handleBid}
                    />
                  </div>
                )}

                {/* NOT CONNECTED */}
                {!currentAccount && (
                  <p style={{ color: "orange" }}>
                    ⚠️ Connect wallet to participate
                  </p>
                )}

                {/* ── SELLER CONTROLS ── */}
                {isSeller && (
                  <div  style={{ marginTop: "20px" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                      🛠 Seller Controls
                    </p>
                  <div className="flex flex-col">
                    {/* END AUCTION — seller can end at any time */}
                    <div className="m-10">
                    <Button className="p-4 w-full"
                      btnName={loading ? "Processing..." : isEnded ? "Finalize Auction" : "End Auction Early"}
                      handleClick={handleEndAuction}
                      disabled={loading}
                    />
                    </div>

                    {/* CANCEL AUCTION — only if zero bids placed */}
                    {bidHistory.length === 0 && !isEnded && (
                     <div className="m-10">
                     <Button 
                        btnName={loading ? "Processing..." : "Cancel Auction"}
                        handleClick={handleCancelAuction}
                        disabled={loading}
                      />
                    </div>

                    )}
                    </div>

                    {bidHistory.length > 0 && !isEnded && (
                      <p style={{ fontSize: "12px", color: "gray", marginTop: "8px" }}>
                        * Cannot cancel — bids have been placed
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* ── FIXED PRICE SECTION ── */
              <>
                {!currentAccount ? (
                  <p style={{ color: "orange" }}>⚠️ Connect wallet to buy</p>
                ) : isSeller ? (
                  <p style={{ color: "gray" }}>You cannot buy your own NFT</p>
                ) : isOwner ? (
                  <Button
                    btnName="List / Resell NFT"
                    handleClick={() =>
                      router.push(`/reSellToken?id=${nft.tokenId}`)
                    }
                  />
                ) : (
                  <Button
                    btnName={loading ? "Purchasing..." : "Buy NFT"}
                    handleClick={handleBuyNFT}
                    disabled={loading}
                  />
                )}
              </>
            )}

          </div>

          {/* ── STATUS MESSAGE ── */}
          {actionMsg && (
            <p
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                background: actionMsg.includes("❌") ? "#ffe0e0" : "#e0ffe0",
                borderRadius: "6px",
                fontWeight: "bold",
                color: actionMsg.includes("❌") ? "#c00" : "#060",
              }}
            >
              {actionMsg}
            </p>
          )}

          {/* ── BID HISTORY ── */}
          {nft?.type === "auction" && (
            <>
              <h3 style={{ marginTop: "30px" }}>Bid History</h3>

              {bidHistory.length === 0 ? (
                <p style={{ color: "gray" }}>No bids yet — be the first!</p>
              ) : (
                <div className={Style.NFTDescription_box_profile_biding_box}>
                  {[...bidHistory].reverse().map((bid, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <p style={{ fontSize: "13px", wordBreak: "break-all" }}>
                        {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                      </p>
                      <p style={{ fontWeight: "bold" }}>{bid.amount} ETH</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default NFTDescription;