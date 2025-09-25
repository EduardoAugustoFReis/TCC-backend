import { Router } from "express";
import { upload } from "../config/multer.js"

const userRouter = Router();
import authMiddleware from "../middlewares/auth.js";
import userController from "../controllers/UserController.js";

userRouter.post("/", upload.single("avatar") ,userController.createUser);
userRouter.get("/", userController.listAllUser);
userRouter.get("/barbers", userController.listBarbers); //rota para listar somente os barbeiros
userRouter.put("/", authMiddleware, upload.single("avatar"), userController.updateUser);
//usuário deleta a si mesmo
userRouter.delete("/deleteUser/:id", authMiddleware, userController.deleteUserByHimself);
//um admin deleta um usuario
userRouter.delete("/:id", authMiddleware, userController.deleteUser);
userRouter.get("/:id", userController.listUserWithId);


export default userRouter;
