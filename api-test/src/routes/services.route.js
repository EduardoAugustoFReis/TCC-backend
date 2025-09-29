import { Router } from "express";
const servicesRouter = Router();
import authMiddleware from "../middlewares/auth.js";
import onlyAdminCreateService from "../middlewares/onlyAdminCreateService.js";
import ServicesController from "../controllers/ServicesController.js";

servicesRouter.post(
  "/",
  authMiddleware, // coloca o token no req.user e valida ele.
  onlyAdminCreateService, // somente admin pode criar um serviço
  ServicesController.create
);
servicesRouter.get("/", ServicesController.listAll);
servicesRouter.delete("/:id", ServicesController.delete);

export default servicesRouter;
