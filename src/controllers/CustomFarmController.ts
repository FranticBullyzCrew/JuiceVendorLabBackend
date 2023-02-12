import { Request, Response } from "express";
import Custom from "../schemas/Custom";

class CustomFarmController {

  async index(req: Request, res: Response) {
    try {
      const data = await Custom.find()
      const final = data.map(({name, image, farm, token, link}) => ({name, image, farm, token, link}))
      return res.status(200).json(final)
    } catch (error) {
      return res.status(404).json({ error: 'Something went wrong, try again' })
    }
  }

}

export default new CustomFarmController();