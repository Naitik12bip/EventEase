import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        movie: { 
            type: Number, // Must match Movie _id type (Number)
            required: true, 
            ref: 'Movie' 
        },
        showDateTime: { type: Date, required: true },
        showPrice: { type: Number, required: true },
        occupiedSeats: { type: Object, default: {} },
    }, 
    { minimize: false, timestamps: true }
);

const Show = mongoose.models.Show || mongoose.model("Show", showSchema);

export default Show;