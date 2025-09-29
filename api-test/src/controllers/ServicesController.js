import { where } from "sequelize";
import db from "../../models/index.js";
const { Service } = db;

class ServicesController {
  create = async (req, res) => {
    try {
      const { name, price, duration } = req.body;

      const newService = await Service.create({
        name,
        price,
        duration,
        userId: req.userId,
      });

      return res.status(201).json(newService);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erro interno de servidor", error });
    }
  };

  listAll = async (req, res) => {
    try {
      const services = await Service.findAll();

      return res.status(200).json(services);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erro interno de servidor", error });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;

      await Service.destroy({
        where: {
          id
        }
      });

      return res.status(200).json({message: "Serviço deletado com sucesso."});
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erro interno de servidor", error });
    }
  };
}

export default new ServicesController();
