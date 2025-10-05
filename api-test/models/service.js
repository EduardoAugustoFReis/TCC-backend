import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Service extends Model {
    static associate(models) {
      // Exemplo de associação com User:
      // Service.belongsTo(models.User, { foreignKey: "userId" });
    }
  }

  Service.init(
    {
      name: DataTypes.STRING,
      price: DataTypes.DECIMAL,
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Service",
    }
  );

  return Service;
};
