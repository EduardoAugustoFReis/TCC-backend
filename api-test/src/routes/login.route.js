import express from "express";
const loginRouter = express();

import loginController from "../controllers/LoginController.js";

loginRouter.post("/", loginController.create);

export default loginRouter;