import { Op, where } from "sequelize";
import db from "../../models/index.js";
const { Appointment, Service, User } = db;

class AppointmentController {
  create = async (req, res) => {
    try {
      const { startTime } = req.body;
      const barberId = req.params.barberId;
      const serviceId = req.params.serviceId;
      const clientId = req.userId;
      const clientRole = req.userRole;

      // Só clientes podem criar
      if (clientRole !== "cliente") {
        return res
          .status(403)
          .json({ message: "Somente clientes podem marcar horário." });
      }

      const start = new Date(startTime);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Data inválida." });
      }

      if (start < new Date()) {
        return res
          .status(400)
          .json({ message: "Não é possível marcar no passado." });
      }

      // procurar o serviço
      const service = await Service.findByPk(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado." });
      }

      // Validar se o barbeiro realmente existe e é barbeiro
      const barber = await User.findByPk(barberId);
      if (!barber || barber.role !== "barbeiro") {
        return res.status(404).json({ message: "Barbeiro não encontrado." });
      }

      // tempo que começa mais a duração.
      const end = new Date(start.getTime() + service.duration * 60000);

      // checa conflito: existe algum agendamento que comece antes do nosso fim
      // e termine depois do nosso começo? então tem sobreposição.
      const conflict = await Appointment.findOne({
        where: {
          barberId,
          startTime: { [Op.lt]: end }, // existente.start < novo.end
          endTime: { [Op.gt]: start }, // existente.end > novo.start
          status: { [Op.not]: "canceled" }, // ignora agendamentos cancelados
        },
      });

      if (conflict) {
        return res
          .status(400)
          .json({ message: "Esse horário já está ocupado." });
      }

      const appointment = await Appointment.create({
        clientId,
        barberId,
        serviceId,
        startTime: start,
        endTime: end,
      });

      return res.json({
        message: "Compromisso agendado com sucesso.",
        appointment,
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  };

  listAll = async (req, res) => {
    try {
      const appointments = await Appointment.findAll({
        include: [
          {
            model: User,
            as: "barber",
            attributes: ["id", "name", "email"],
          },
          {
            model: User,
            as: "client",
            attributes: ["id", "name", "email"],
          },
          {
            model: Service,
            as: "service",
            attributes: ["id", "name", "price", "duration"],
          },
        ],
        order: [["startTime", "ASC"]], // listar por ordem de criação
      });

      return res.status(200).json(appointments);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro interno no servidor", error });
    }
  };

  listBarbersAppointments = async (req, res) => {
    try {
      const userId = req.userId;
      const userRole = req.userRole;

      if (userRole !== "barbeiro") {
        return res.status(403).json({
          message: "Somente barbeiros podem acessar seus compromissos.",
        });
      }

      const appointments = await Appointment.findAll({
        where: { barberId: userId },
        include: [
          {
            model: User,
            as: "client",
            attributes: ["id", "name", "email"],
          },
          {
            model: Service,
            as: "service",
            attributes: ["id", "name", "duration"],
          },
        ],
        order: [["startTime", "ASC"]],
      });

      return res.status(200).json(appointments);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro interno no servidor", error });
    }
  };

  listMyAppointments = async (req, res) => {
    try {
      const userId = req.userId;

      const appointments = await Appointment.findAll({
        where: { clientId: userId },
        include: [
          {
            model: User,
            as: "barber",
            attributes: ["id", "name", "email", "phone"],
          },
          {
            model: Service,
            as: "service",
            attributes: ["id", "name", "price", "duration"],
          }
        ],
        order: [["startTime", "ASC"]],
      });

      return res.status(200).json(appointments);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro interno no servidor", error });
    }
  };

  listById = async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findByPk(id, {
        include: [
          {
            model: User,
            as: "barber",
            attributes: ["id", "name", "email"],
          },
          {
            model: User,
            as: "client",
            attributes: ["id", "name", "email"],
          },
          {
            model: Service,
            as: "service",
            attributes: ["id", "name", "price", "duration"],
          },
        ],
      });
      if (!appointment) {
        return res.status(404).json({ message: "Compromisso não encontrado." });
      }

      return res.status(200).json(appointment);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro interno no servidor", error });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const userRole = req.userRole;

      const appointment = await Appointment.findByPk(id);
      if (!appointment) {
        return res.status(404).json({ message: "Compromisso não encontrado." });
      }

      // Se for "cliente", só pode cancelar compromissos dele e ainda pendentes
      if (userRole === "cliente") {
        if (appointment.clientId !== userId) {
          return res.status(400).json({
            message: "Você não pode cancelar o compromisso de outro cliente.",
          });
        }
        if (appointment.status === "confirmed") {
          return res.status(400).json({
            message: "Um compromisso confirmado não pode ser deletado.",
          });
        }
      }

      // Se for "cliente", só pode cancelar compromissos dele e ainda pendentes
      if (userRole === "barbeiro" && appointment.barberId !== userId) {
        return res.status(403).json({
          message: "Você não pode cancelar compromisso de outro barbeiro.",
        });
      }

      // Admin pode deletar qualquer compromisso
      await appointment.destroy();

      return res
        .status(200)
        .json({ message: "Compromisso deletado com sucesso." });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  };

  changeStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.userRole;
      const userId = req.userId;
      const { status } = req.body;

      // Validar status
      if (!["confirmed", "canceled"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Status inválido, use 'confirmed' ou 'canceled'." });
      }

      // Buscar compromisso
      const appointment = await Appointment.findByPk(id);
      if (!appointment) {
        return res.status(404).json({ message: "Compromisso não encontrado." });
      }

      // Verificar role
      if (userRole !== "barbeiro") {
        return res.status(400).json({
          message: "Somente o barbeiro pode confirmar ou cancelar o corte.",
        });
      }

      // verificar se o barbeiro é dono do compromisso.
      if (appointment.barberId !== userId) {
        return res.status(403).json({
          message: "Você não pode alterar o compromisso de outro barbeiro.",
        });
      }

      appointment.status = status;
      await appointment.save();

      return res
        .status(200)
        .json({ message: `Compromisso ${status} com sucesso.`, appointment });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  };
}

export default new AppointmentController();
