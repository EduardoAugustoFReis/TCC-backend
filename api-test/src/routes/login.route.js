import express from "express";
const loginRouter = express();

import loginController from "../controllers/LoginController.js";

loginRouter.post("/", loginController.create);
loginRouter.post("/logout", loginController.logout);

export default loginRouter;