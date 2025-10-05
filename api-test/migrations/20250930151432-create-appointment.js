// migrations/XXXX-create-appointment.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Appointments", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    startTime: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    endTime: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    clientId: {
      type: Sequelize.INTEGER,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    barberId: {
      type: Sequelize.INTEGER,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    serviceId: {
      type: Sequelize.INTEGER,
      references: { model: "Services", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    status: {
      type: Sequelize.ENUM("pending", "confirmed", "canceled"),
      defaultValue: "pending",
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("Appointments");
}
