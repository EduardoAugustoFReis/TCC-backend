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

      const serviceDurationMs = service.duration * 60 * 1000; // minutos -> ms
      const toleranceMs = 15 * 60 * 1000; // tolerância (15 min)
      const slotMinutes = 15; // granularidade dos slots (minutos) - ajustar conforme desejar
      const slotMs = slotMinutes * 60 * 1000;

      // Construir opening/closing em UTC (date no formato YYYY-MM-DD)
      const year = Number(date.slice(0, 4));
      const month = Number(date.slice(5, 7)) - 1;
      const day = Number(date.slice(8, 10));

      const openingTime = new Date(Date.UTC(year, month, day, 8, 0, 0)); // 08:00 UTC
      const closingTime = new Date(Date.UTC(year, month, day, 18, 0, 0)); // 18:00 UTC

      // Buscar compromissos que se sobrepõem ao período de funcionamento (mais abrangente)
      const appointments = await Appointment.findAll({
        where: {
          barberId,
          status: { [Op.not]: "canceled" },
          [Op.and]: [
            { startTime: { [Op.lt]: closingTime } },
            { endTime: { [Op.gt]: openingTime } },
          ],
        },
      });

      // Número de slots no dia
      const totalSlots = Math.ceil((closingTime - openingTime) / slotMs);

      // Array que marca ocupação: false = livre, true = ocupado
      const occupied = new Array(totalSlots).fill(false);

      // Marca todos os slots que qualquer compromisso ocupa
      appointments.forEach((appt) => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);

        // expandir com tolerância: considerar desde (start - toleranceBefore) até (end + toleranceAfter)
        // aqui uso tolerância somente após o compromisso (como no seu exemplo),
        // mas você pode aplicar antes também se desejar:
        const markStart = Math.max(apptStart.getTime() - toleranceMs, openingTime.getTime());
        const markEnd = Math.min(apptEnd.getTime() + toleranceMs, closingTime.getTime());

        // índices dos slots a marcar
        const startIndex = Math.floor((markStart - openingTime.getTime()) / slotMs);
        const endIndexExclusive = Math.ceil((markEnd - openingTime.getTime()) / slotMs);

        for (let i = Math.max(0, startIndex); i < Math.min(totalSlots, endIndexExclusive); i++) {
          occupied[i] = true;
        }
      });

      // Quantos slots consecutivos são necessários para o serviço pedido
      const neededSlots = Math.ceil(serviceDurationMs / slotMs);

      // Procura sequência de slots livres de tamanho neededSlots
      const availableSlots = [];
      let consecutive = 0;
      let windowStart = 0;

      for (let i = 0; i < totalSlots; i++) {
        if (!occupied[i]) {
          if (consecutive === 0) windowStart = i;
          consecutive++;
          if (consecutive >= neededSlots) {
            // encontramos um intervalo livre de tamanho suficiente: converte para horários
            const slotStartTime = new Date(openingTime.getTime() + windowStart * slotMs);
            const slotEndTime = new Date(slotStartTime.getTime() + serviceDurationMs);

            // Opcional: checar se slotEndTime + tolerance cabe antes do fechamento (ou já garantido)
            if (slotEndTime.getTime() <= closingTime.getTime()) {
              availableSlots.push({
                start: slotStartTime.toISOString(),
                end: slotEndTime.toISOString(),
              });
            }

            // avançar janela: se quiser apenas o primeiro disponível, pode break aqui.
            // para listar todos, avançamos uma posição e recomeçamos contagem (sliding window)
            // aqui, vamos mover windowStart + 1 para procurar próximos encaixes
            i = windowStart + 0; // mantemos i; em seguida, vamos incrementar i no loop
            // reduzir consecutive para consecutive - 1 e avançar windowStart em 1
            consecutive = consecutive - 1;
            windowStart = windowStart + 1;
          }
        } else {
          consecutive = 0;
        }
      }

      // Retorna todos os horários possíveis (ou apenas o primeiro, se preferir)
      return res.status(200).json({ availableSlots });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor", error });
    }
  };

}

export default new AppointmentController();
