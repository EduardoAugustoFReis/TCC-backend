import express from "express";
const routes = express();

import userRoute from "./user.route.js";

routes.use("/users", userRoute);

export default routes;