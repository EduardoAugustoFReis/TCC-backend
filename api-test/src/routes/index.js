import express from "express";
const routes = express();

import userRoute from "./user.route.js";
import loginRouter from "./login.route.js";
import servicesRouter from "./services.route.js";
import appointmentRouter from "./appointments.routes.js";

routes.use("/users", userRoute);
routes.use("/login", loginRouter);
routes.use("/services", servicesRouter);
routes.use("/appointments", appointmentRouter);


export default routes;