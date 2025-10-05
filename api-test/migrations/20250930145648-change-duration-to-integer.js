"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Services", "duration", {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 30, 
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Services", "duration", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}
