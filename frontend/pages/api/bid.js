// pages/api/bid.js
// Stores bids in MongoDB Atlas for leaderboard display.
// Actual ETH transfer happens on-chain via placeBid() in the smart contract.

import dbConnect from "../../lib/dbConnect";
import Auction from "../../models/Auction";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { nftId, address, amount } = req.body;

  if (!nftId || !address || amount === undefined) {
    return res.status(400).json({ message: "Missing required fields: nftId, address, amount" });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Invalid bid amount" });
  }

  await dbConnect();

  let auction = await Auction.findOne({ nftId });
  if (!auction) {
    auction = await Auction.create({
      nftId,
      endTime: new Date(Date.now() + 10 * 60 * 1000),
      bids: [],
    });
  }

  if (new Date() > new Date(auction.endTime)) {
    return res.status(400).json({ success: false, message: "Auction has ended" });
  }

  // wallet address IS the identity — no display name needed
  auction.bids.push({ bidder: address, address, amount, placedAt: new Date() });

  if (amount > auction.highestBid) {
    auction.highestBid = amount;
    auction.highestBidder = address;
  }

  await auction.save();

  const top3 = [...auction.bids]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return res.status(200).json({
    success: true,
    auction: {
      nftId: auction.nftId,
      endTime: auction.endTime,
      highestBid: auction.highestBid,
      highestBidder: auction.highestBidder,
      top3,
      totalBids: auction.bids.length,
    },
  });
}