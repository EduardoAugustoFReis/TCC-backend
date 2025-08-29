import express from "express";
const routes = express();

import userRouter from "./user.routes.js";

routes.use("/users", userRouter);

export default routes;