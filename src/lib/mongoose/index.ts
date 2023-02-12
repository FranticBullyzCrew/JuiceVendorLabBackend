import mongoose from "mongoose";

export async function initMongoose() {
  await mongoose.connect(process.env.MONGO_URL as string);

  console.log("DB connected");

}
