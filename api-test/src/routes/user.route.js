import { Router } from "express";
const userRouter = Router();

import userController from "../controllers/UserController.js";

userRouter.post("/", userController.createUser);
userRouter.get("/:id", userController.listUserWithId);
userRouter.put("/:id", userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);

export default userRouter;
