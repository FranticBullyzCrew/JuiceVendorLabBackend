import { Schema, model, Document } from "mongoose";

export interface ITotalStaked extends Document {
  totalStaked: Number;
  address: string;
  updatedAt: Date;
}

const TotalStakedSchema = new Schema({
  address: { type: String, required: true },
  totalStaked: { type: Number, required: true },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default model<ITotalStaked>("TotalStaked", TotalStakedSchema);
