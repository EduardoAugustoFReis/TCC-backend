import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Slot extends Model {
    static associate(models) {
      Slot.belongsTo(models.User, {
        as: "barber",
        foreignKey: "barberId",
      });
    }
  }

  Slot.init(
    {
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      barberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("available", "booked", "canceled"),
        allowNull: false,
        defaultValue: "available",
      },
    },
    {
      sequelize,
      modelName: "Slot",
    }
  );

  return Slot;
};
