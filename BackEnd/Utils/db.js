import mongoose from 'mongoose';
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DATABASE_URL);
        
        console.log(`Connected to MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(` Unexpected MongoDB connection error:`, error.message);
        process.exit(-1); 
    }
};

export default connectDB;