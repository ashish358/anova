// pages/api/send-mail.js
import nodemailer from "nodemailer";
import mongoose from "mongoose";

// ─── Subscriber Schema ───────────────────────────────────────────────────────
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true },
});

// Avoid model re-registration in Next.js hot-reload
const Subscriber =
  mongoose.models.Subscriber ||
  mongoose.model("Subscriber", subscriberSchema);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return; // already connected
  await mongoose.connect(process.env.MONGODB_URI);
};

// ─── Nodemailer Transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,      // your Gmail address
    pass: process.env.EMAIL_PASS,      // Gmail App Password
  },
});

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { nftName, creatorAddress } = req.body;

  if (!nftName) {
    return res.status(400).json({ message: "nftName is required" });
  }

  try {
    // 1. Connect to MongoDB and fetch ALL subscribers
    await connectDB();
    const subscribers = await Subscriber.find({});

    if (subscribers.length === 0) {
      return res.status(200).json({ message: "No subscribers found" });
    }

    const emails = subscribers.map((s) => s.email);

    // 2. Send one email to all subscribers (BCC for privacy)
    await transporter.sendMail({
      from: `"NFT Marketplace" <${process.env.EMAIL_USER}>`,
      bcc: emails,          // BCC keeps subscriber emails private from each other
      subject: `🎨 New NFT Listed: "${nftName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #7c3aed;">🖼️ New NFT Just Dropped!</h2>
          <p style="font-size: 16px;">A new NFT has been listed on the marketplace:</p>

          <div style="background: #f5f3ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0; color: #4c1d95;">${nftName}</h3>
            ${creatorAddress ? `<p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Created by: ${creatorAddress}</p>` : ""}
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/searchPage"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View on Marketplace →
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            You're receiving this because you subscribed to our NFT Marketplace notifications.
          </p>
        </div>
      `,
    });

    console.log(`✅ Notification sent to ${emails.length} subscribers`);
    return res.status(200).json({
      message: `Notification sent to ${emails.length} subscribers`,
      count: emails.length,
    });

  } catch (error) {
    console.error("❌ send-mail error:", error);
    return res.status(500).json({ message: "Failed to send emails", error: error.message });
  }
}