import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        // FIX: Changed type to ObjectId to work with 'ref'
        movie: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            ref: 'Movie' 
        },
        showDateTime: { type: Date, required: true },
        showPrice: { type: Number, required: true },
        // NOTE: Using Map or a nested Schema is often safer for objects, 
        // but {minimize: false} ensures this empty object is saved.
        occupiedSeats: { type: Object, default: {} },
    }, 
    { minimize: false, timestamps: true } // Added timestamps for better record keeping
);

const Show = mongoose.model("Show", showSchema);

export default Show;