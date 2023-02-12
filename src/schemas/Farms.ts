import { Schema, model, Document } from "mongoose";

export interface IFarms extends Document {
  name: string;
  address: string;
  tokenName: string;
  creatorIDs: string[];
  mintList: string;
  supply: string;
}

const FarmSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true},
    tokenName: { type: String, required: false},
    creatorIDs: { type: Array, required: true},
    mintList: { type: String, required: false},
    supply: { type: String, required: false},
  },
);

export default model<IFarms>("Farm", FarmSchema);
