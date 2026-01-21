import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected'));
        
        // Ensure your MONGODB_URI is in .env
        await mongoose.connect(`${process.env.MONGODB_URI}/eventease`);
    } catch (error) {
        console.error("Database connection error:", error.message);
    }
}

export default connectDB;