import mongoose from "mongoose";

export async function connectDatabase() {
  const uri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/billpro_crm";

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
