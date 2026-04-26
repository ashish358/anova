// pages/api/getAuction.js
import dbConnect from "../../lib/dbConnect";
import Auction from "../../models/Auction";

const AUCTION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { nftId } = req.query;
  if (!nftId) return res.status(400).json({ message: "nftId is required" });

  await dbConnect();

  let auction = await Auction.findOne({ nftId });

  // If no auction exists, create one with a 10-minute window starting now
  if (!auction) {
    const endTime = new Date(Date.now() + AUCTION_DURATION_MS);
    auction = await Auction.create({ nftId, endTime, bids: [] });
  }

  // Auto-allocate if auction has ended and not yet allocated
  if (!auction.allocated && new Date() > new Date(auction.endTime)) {
    if (auction.bids.length > 0) {
      // Sort to find the winner
      const sorted = [...auction.bids].sort((a, b) => b.amount - a.amount);
      auction.winner = sorted[0].address;
      auction.allocated = true;
      await auction.save();
    }
  }

  // Top 3 bids sorted by amount descending
  const top3 = [...auction.bids]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return res.status(200).json({
    nftId: auction.nftId,
    endTime: auction.endTime,
    highestBid: auction.highestBid,
    highestBidder: auction.highestBidder,
    allocated: auction.allocated,
    winner: auction.winner,
    top3,
    totalBids: auction.bids.length,
  });
}