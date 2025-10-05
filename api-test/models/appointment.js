import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.User, {
        as: "client",
        foreignKey: "clientId",
      });
      Appointment.belongsTo(models.User, {
        as: "barber",
        foreignKey: "barberId",
      });
      Appointment.belongsTo(models.Service, {
        as: "service",
        foreignKey: "serviceId",
      });
    }
  }

  Appointment.init(
    {
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      clientId: DataTypes.INTEGER,
      barberId: DataTypes.INTEGER,
      serviceId: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "canceled"),
        defaultValue: "pending",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Appointment",
    }
  );

  return Appointment;
};
