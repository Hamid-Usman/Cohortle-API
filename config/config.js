require("dotenv").config();
module.exports = {
  local: {
    username: "root",
    password: "root1234",
    database: "cohortle",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  development: {
    username: "root",
    password: null,
    database: "cohortle",
    host: "127.0.0.1",
    // "port": process.env.DB_PORT,
    dialect: "mysql",
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
