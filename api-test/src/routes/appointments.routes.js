import { Router } from "express";
const appointmentRouter = Router();
import authMiddleware from "../middlewares/auth.js";
import AppointmentController from "../controllers/AppointmentController.js";

appointmentRouter.post(
  "/barbers/:barberId/services/:serviceId",
  authMiddleware,
  AppointmentController.create
);
appointmentRouter.get("/", AppointmentController.listAll);
appointmentRouter.get("/barbers", authMiddleware, AppointmentController.listBarbersAppointments);
appointmentRouter.get("/client", authMiddleware, AppointmentController.listMyAppointments);
appointmentRouter.get("/:id", AppointmentController.listById);
appointmentRouter.delete("/:id", authMiddleware, AppointmentController.delete);
appointmentRouter.patch(
  "/:id",
  authMiddleware,
  AppointmentController.changeStatus
);

export default appointmentRouter;
