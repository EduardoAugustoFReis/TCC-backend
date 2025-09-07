"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: Sequelize.STRING,
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      phone: Sequelize.STRING,
      role: {
        type: Sequelize.ENUM("admin", "barbeiro", "cliente"),
        allowNull: false,
        defaultValue: "cliente",
      },
      avatar: {
        type: Sequelize.STRING, // vai guardar a URL ou caminho do arquivo
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
