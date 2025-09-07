import db from "../../models/index.js";
const { User } = db;

class UserController {
  createUser = async (req, res, next) => {
    const { name, email, phone, password } = req.body;

    try {
      const avatar = req.file ? `/uploads/${req.file.filename}` : null;
      const newUser = await User.create({
        name,
        email,
        phone,
        password,
        avatar,
      });
      const { id, role } = newUser;

      return res.status(201).json({ id, name, email, phone, role, avatar });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  updateUser = async (req, res, next) => {
    const { name, email, phone, role, password } = req.body;
    const id = req.userId;

    try {
      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json("Usuário não encontrado no banco de dados.");
      }
      const avatar = req.file ? `/uploads/${req.file.filename}` : user.avatar;
      // atualiza os campos
      await user.update({ name, email, phone, role, password, avatar });

      // devolve só os dados seguros (sem senha)
      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      });
    } catch (error) {
      return res.status(500).json("Erro interno de servidor.");
    }
  };

  deleteUser = async (req, res, next) => {
    const id = req.userId;

    try {
      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json("Usuário não encontrado no banco de dados.");
      }

      await user.destroy();

      return res.status(200).json("Usuário deletado com sucesso.");
    } catch (error) {
      return res.status(500).json("Erro interno de servidor.");
    }
  };

  listUserWithId = async (req, res, next) => {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json("Usuário não encontrado no banco de dados.");
      }

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } catch (error) {
      return res.status(500).json("Erro interno de servidor.");
    }
  };

  listAllUser = async (req, res, next) => {
    try {
      const users = await User.findAll();

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json("Erro interno de servidor.");
    }
  };

  listBarbers = async (req, res, next) => {
    try {
      const barbers = await User.findAll({
        where: { role: "barbeiro" },
        attributes: ["id", "name", "email", "phone"],
      });

      res.status(200).json(barbers);
    } catch (error) {
      return res.status(500).json("Erro interno de servidor.");
    }
  };
}

export default new UserController();
