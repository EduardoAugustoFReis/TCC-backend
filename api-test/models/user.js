import { Model } from "sequelize";
import bcrypt from "bcryptjs";

export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {}

    // método para comparar senha
    async checkPassword(password) {
      return bcrypt.compare(password, this.password);
    }

    // remove a "password" do JSON retornado
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING, // URL da imagem 
      },
      role: {
        type: DataTypes.ENUM("admin", "barbeiro", "cliente"),
        allowNull: false,
        defaultValue: "cliente",
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  // hook para criptografar a senha
  User.addHook("beforeSave", async (user) => {
    if (user.changed("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }
  });

  return User;
};
