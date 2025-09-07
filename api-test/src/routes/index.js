import express from "express";
const routes = express();

import userRoute from "./user.route.js";
import loginRouter from "./login.route.js";

routes.use("/users", userRoute);
routes.use("/login", loginRouter);


export default routes;