import { connectDB } from "../../lib/mongodb";
import Subscriber from "../../models/Subscriber";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;

  await connectDB();

  const exists = await Subscriber.findOne({ email });
  if (exists) {
    return res.json({ message: "Already subscribed" });
  }

  await Subscriber.create({ email });

  res.json({ message: "Subscribed successfully" });
}