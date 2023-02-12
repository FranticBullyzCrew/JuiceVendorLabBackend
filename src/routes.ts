import FarmsController from "./controllers/FarmsController";
import { Router } from "express";
import cors from "cors";
import CustomFarmController from "./controllers/CustomFarmController";
import TotalStakedController from "./controllers/TotalStakedController";

const routes = Router();

routes.get("/", FarmsController.getFarms);
routes.get("/getFarm/:address", FarmsController.getFarm);
routes.get("/getTotalStaked/:address", TotalStakedController.getTotalStaked);
routes.get("/getNFTs/:address/:publickey", FarmsController.getNFTs);
routes.get("/getUserStaked/:address/:publickey", FarmsController.getUserStaked);
routes.post("/customfarms", CustomFarmController.index);

export default routes;
