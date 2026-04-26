// models/Auction.js
import mongoose from "mongoose";

const BidSchema = new mongoose.Schema({
  bidder: { type: String, required: true },       // display name
  address: { type: String, required: true },       // wallet address
  amount: { type: Number, required: true },
  placedAt: { type: Date, default: Date.now },
});

const AuctionSchema = new mongoose.Schema({
  nftId: { type: String, required: true, unique: true },
  endTime: { type: Date, required: true },
  bids: [BidSchema],
  highestBid: { type: Number, default: 0 },
  highestBidder: { type: String, default: null },
  allocated: { type: Boolean, default: false },
  winner: { type: String, default: null },
});

export default mongoose.models.Auction ||
  mongoose.model("Auction", AuctionSchema);