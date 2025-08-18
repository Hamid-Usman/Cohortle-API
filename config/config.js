require('dotenv').config(); // loads from .env

module.exports = {
  local: {
    username: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "database_production",
    host: process.env.DB_HOSTNAME || "127.0.0.1",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
  },
  development: {
    username: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "database_production",
    host: process.env.DB_HOSTNAME || "127.0.0.1",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
  },
  test: {
    username: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "database_production",
    host: process.env.DB_HOSTNAME || "127.0.0.1",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
  },
  production: {
    username: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "database_production",
    host: process.env.DB_HOSTNAME || "127.0.0.1",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
  }
};
