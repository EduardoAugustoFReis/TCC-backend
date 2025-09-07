import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import process from "process";
import Sequelize from "sequelize";
import configFile from "../config/config.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = configFile[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Lê todos os arquivos de models (exceto index.js)
const modelFiles = fs.readdirSync(__dirname).filter(
  (file) =>
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-3) === ".js" &&
    file.indexOf(".test.js") === -1
);

for (const file of modelFiles) {
  const modulePath = pathToFileURL(path.join(__dirname, file)).href;
  const { default: modelDefiner } = await import(modulePath);
  const model = modelDefiner(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Associações
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
