import express from "express";
const userRouter = express();

import userController from "../controller/userController.js";

userRouter.post("/:id", userController.createUser);
userRouter.put("/:id", userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);
userRouter.get("/:id", userController.showUserWithId);

export default userRouter;