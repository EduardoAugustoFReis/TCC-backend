import jwt from "jsonwebtoken";
import db from "../../models/index.js";
import authConfig from "../config/authConfig.js";
import redis from "../config/redis.js";
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

    const { id, name, phone, role, avatar } = user;

    return res.json({
      user: {
        id,
        name,
        email,
        phone,
        role,
        avatar,
      },
      token: jwt.sign({ id, role }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  };

  
  logout = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({error: "Token não existe."});
    };

    const [, token] = authHeader.split(" ");

    try {
      const decoded = jwt.verify(token, authConfig.secret);

      // calcula quanto tempo falta pro token expirar
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);

      // guarda token no redis com tempo de expiração
      await redis.setex(`blacklist:${token}`, ttl, "true");

      return res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      return res.status(400).json({ error: "Token inválido" });
    }
  }
}

export default new LoginController();
