const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_CONNECTION_URI}`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 30000, // Set a higher timeout for server selection
                socketTimeoutMS: 30000,          // Set a higher socket timeout
              }
        );
        console.log(
            `MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`,
        );
    } catch (error) {
        console.log("MongoDB Connection Error: ", error);
        process.exit(1);
    }
};

module.exports = connectDB;
