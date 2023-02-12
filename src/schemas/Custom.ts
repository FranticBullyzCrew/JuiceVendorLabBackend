import { Schema, model, Document } from "mongoose";

export interface ICustom extends Document {
  name?: string;
  image: string;
  farm: string;
  token: string;
  link: string;
}

const CustomSchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    farm: { type: String, required: true },
    token: { type: String, required: true },
    link: { type: String, required: true },
  },
  {
    // timestamps: true,
  }
);

export default model<ICustom>("Custom", CustomSchema);
