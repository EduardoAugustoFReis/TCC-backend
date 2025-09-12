import jwt from "jsonwebtoken";
import db from "../../models/index.js";
import authConfig from "../config/authConfig.js";
const { User } = db;

class LoginController {
  create = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json("Usuário não encontrado no banco de dados.");
    }

    // verificar se a senha não bate
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json("Senha incorreta.");
    }

    const { id, name, phone, role } = user;

    return res.json({
      user: {
        id,
        name,
        email,
        phone,
        role,
      },
      token: jwt.sign({ id, role }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  };
}

export default new LoginController();
