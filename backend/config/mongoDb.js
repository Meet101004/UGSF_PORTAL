// config/mongoDB.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB Connected Successfully!");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

export default connectMongoDB;
