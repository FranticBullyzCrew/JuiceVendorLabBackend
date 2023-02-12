import "./env";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { initMongoose } from "./lib/mongoose";
import Customer from "./schemas/Farms";
// import drop from "setRarities";

const port = process.env.PORT || 3333;

export const invites = new Map();

(async () => {
  try {
    const server = express();

    server.use(cors());
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    server.use(routes);

    server.listen(port, (err?: any) => {
      if (err) throw err;
      console.log(`🔥 Server started on port ${port} 🔥`);
    });

    await initMongoose();

    // drop()


  } catch (error) {
    console.error(error);
  }
})();
