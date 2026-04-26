import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});

export default mongoose.models.Subscriber || mongoose.model("Subscriber", schema);