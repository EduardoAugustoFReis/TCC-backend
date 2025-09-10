import { Router } from "express";
import { upload } from "../config/multer.js"

const userRouter = Router();
import authMiddleware from "../middlewares/auth.js";
import userController from "../controllers/UserController.js";

userRouter.post("/", upload.single("avatar") ,userController.createUser);
userRouter.get("/", userController.listAllUser);
userRouter.get("/barbers", userController.listBarbers); //rota para listar somente os barbeiros
userRouter.put("/:id", authMiddleware, upload.single("avatar"), userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);
userRouter.get("/:id", userController.listUserWithId);


export default userRouter;
