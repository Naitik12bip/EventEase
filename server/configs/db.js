import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected to EventEase'));
        
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'eventease'
        });
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
}

export default connectDB;
