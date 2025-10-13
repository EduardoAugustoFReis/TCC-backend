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
      return res
        .status(500)
        .json({ message: "Erro interno no servidor", error });
    }
  };

  listAvailableTimes = async (req, res) => {
    try {
      const { barberId } = req.params;
      const { date, serviceId } = req.query;

      if (!date || !serviceId) {
        return res
          .status(400)
          .json({ message: "Informe a data (date) e o serviço (serviceId)." });
      }

      const barber = await User.findByPk(barberId);
      if (!barber || barber.role !== "barbeiro") {
        return res.status(404).json({ message: "Barbeiro não encontrado." });
      }

      const service = await Service.findByPk(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado." });
      }

      const serviceDuration = service.duration * 60000; // minutos → ms
      const tolerance = 15 * 60000; // tolerância de 15 min

      // Buscar compromissos do barbeiro no dia
      const appointments = await Appointment.findAll({
        where: {
          barberId,
          startTime: {
            [Op.between]: [
              new Date(`${date}T00:00:00`),
              new Date(`${date}T23:59:59`),
            ],
          },
          status: { [Op.not]: "canceled" },
        },
      });

      // horário de funcinamento do estabelecimento.
      const openingTime = new Date(`${date}T08:00:00`);
      const closingTime = new Date(`${date}T18:00:00`);

      // criação dos slots
      const availableSlots = [];
      let currentTime = new Date(openingTime);

      // roda o loop enquanto o current + duration + tolerance terminar antes do fechamento da barbearia.
      while (
        currentTime.getTime() + serviceDuration + tolerance <=
        closingTime.getTime()
      ) {
        // Calcula o final do slot baseado na duração do serviço (sem tolerância ainda)
        const slotEnd = new Date(currentTime.getTime() + serviceDuration);

        // Checa se o slot atual conflita com algum compromisso existente
        const isConflict = appointments.some((appt) => {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);

          // Conflito ocorre se:
          // - O início do slot atual for antes do fim do compromisso + tolerância
          // - E o fim do slot for depois do início do compromisso
          return (
            currentTime < new Date(apptEnd.getTime() + tolerance) &&
            slotEnd > apptStart
          );
        });

        // Se não houver conflito, o slot é considerado disponível
        if (!isConflict) {
          // Ajusta o horário para o fuso de Brasília (UTC-3)
          const brasiliaStart = new Date(
            currentTime.getTime() - 3 * 60 * 60000
          );
          const brasiliaEnd = new Date(slotEnd.getTime() - 3 * 60 * 60000);

          // Adiciona o slot disponível ao array
          // Remove o "Z" do toISOString() para não indicar UTC
          availableSlots.push({
            start: brasiliaStart.toISOString().replace("Z", ""),
            end: brasiliaEnd.toISOString().replace("Z", ""),
          });
        }

        // Avança para o próximo slot:
        // - Pula a duração do serviço + tolerância (15 min)
        // - Isso garante que o próximo horário disponível começa após o fim do anterior + tolerância
        currentTime = new Date(
          currentTime.getTime() + serviceDuration + tolerance
        );
      }

      return res.status(200).json({ availableSlots });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro interno no servidor", error });
    }
  };
}

export default new AppointmentController();
