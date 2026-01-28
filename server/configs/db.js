import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected to EventEase'));
        
        // This method is cleaner and prevents double-slash errors
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'eventease' // Forces Mongoose to use this specific database
        });
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1); // Stop the server if DB connection fails
    }
}

export default connectDB;