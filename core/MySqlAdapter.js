const { Sequelize } = require("sequelize");
const MkdConfig = require("./../core/config");

class MkdSqlAdapterSetting {
  constructor() {
    this._config = MkdConfig.getInstance().get_config();
    this._connection = createSequelizeConnection(this._config);
  }

  getConnection() {
    if (!this._connection) {
      this._connection = createSequelizeConnection(this._config);
    }
    return this._connection;
  }
}

const MySqlAdapter = (function () {
  let instance;

  function createInstance() {
    let classObj = new MkdSqlAdapterSetting();
    return classObj;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

module.exports = MySqlAdapter;

function createSequelizeConnection(config) {
  return new Sequelize(
    config["database-name"],
    config["database-u-ser"],
    config["database-password"],
    {
      dialect: "mysql",
      dialectOptions: {
        multipleStatements: true,
      },
      host: config["database-hostname"],
      port: config["database-port"],
      logging: console.log,
      timezone: "+00:00",
      pool: {
        maxConnections: 1,
        minConnections: 0,
        maxIdleTime: 100,
      },
      define: {
        timestamps: false,
        underscoredAll: true,
        underscored: true,
      },
    },
  );
}
