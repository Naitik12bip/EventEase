import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: { 
      type: Number, // Keep it as a Number
      required: true
    },
    showDateTime: { type: Date, required: true },
    showPrice: { type: Number, required: true },
    occupiedSeats: { type: Object, default: {} },
  },
  { minimize: false, timestamps: true }
);

const Show = mongoose.models.Show || mongoose.model("Show", showSchema);

export default Show;
