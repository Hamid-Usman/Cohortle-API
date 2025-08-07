const { Sequelize, QueryTypes } = require("sequelize");
const { dbConnection } = require("./DbConnection");
const { sqlDateFormat, sqlDateTimeFormat } = require("../services/UtilService");

module.exports = class BackendSDK {
  constructor() {
    this._dbConnection = dbConnection;
    this._database = process.env.DB_DATABASE;
    this._table = "";
    this.potentialInjectionKeywords = ["union", "from", "`", "--", "++", ";"];
  }

  setTable(table) {
    this._table = this._database + "." + table;
  }

  getTable() {
    return this._table;
  }

  checkSQLInjection(sqlString) {
    sqlString = sqlString ?? "";

    for (let x of this.potentialInjectionKeywords) {
      if (sqlString.toLowerCase().includes(x))
        throw new Error("Custom sql string validation error");
    }
  }

  validateFieldNames(keyNames) {
    if (!keyNames) return;
    if (keyNames?.type == "string") keyNames = [keyNames];
    for (let keyName of keyNames) {
      keyName = keyName ?? "";

      if (keyName.search(/[^A-Z^a-z^0-9^_^.]/g) != -1)
        throw new Error("Key name invalid");
    }
  }

  async get(
    where,
    selectStr = "*",
    orderBy = "id",
    direction = "DESC",
    customWhere = null
  ) {
    try {
      let sql = "SELECT " + selectStr + " FROM " + this._table + " WHERE ";
      let rows = [];
      let count = 1;
      let bind = [];

      this.checkSQLInjection(selectStr);
      this.checkSQLInjection(customWhere);
      for (const key in where) {
        if (Object.hasOwnProperty.call(where, key)) {
          const element = where[key];
          this.validateFieldNames(key);
          rows.push(`\`${key}\` = $${count}`);
          count++;
          bind.push(element);
        }
      }

      if (count == 1) {
        sql += " 1";
      }

      sql += rows.join(" AND ");
      if (customWhere) sql += " and " + customWhere + " ";
      sql += ` ORDER BY \`${orderBy}\` ${direction}`;
      const result = await this._dbConnection.query(sql, {
        bind: bind,
        type: QueryTypes.SELECT,
      });

      if (result.length > 0) {
        return result;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async insert(payload) {
    try {
      if (!payload.hasOwnProperty("created_at"))
        payload["created_at"] = sqlDateTimeFormat(new Date());

      if (!payload.hasOwnProperty("updated_at"))
        payload["updated_at"] = sqlDateTimeFormat(new Date());

      for (const key in payload) {
        const item = payload[key];
        if (typeof item === "undefined") {
          delete payload[key];
        }
      }
      const fields = Object.keys(payload);
      const questionMarks = [];
      for (let i = 0; i < fields.length; i++) {
        questionMarks.push("?");
      }

      let sql =
        "INSERT INTO " +
        this._table +
        " (" +
        fields.join(",") +
        ") VALUES (" +
        questionMarks.join(",") +
        ");";
      let bind = [];
      for (const key in payload) {
        if (Object.hasOwnProperty.call(payload, key)) {
          this.validateFieldNames(key);
          const element = payload[key];
          bind.push(element);
        }
      }

      const result = await this._dbConnection.query(sql, {
        replacements: bind,
        type: Sequelize.QueryTypes.INSERT,
      });

      if (result.length == 2) {
        return result[0];
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(payload, id) {
    try {
      let sql = "UPDATE " + this._table + " SET ";
      let rows = [];
      let bind = [];

      if (!payload.hasOwnProperty("updated_at"))
        payload["updated_at"] = sqlDateTimeFormat(new Date());

      for (const key in payload) {
        if (Object.hasOwnProperty.call(payload, key)) {
          const element = payload[key];
          if (typeof element === "undefined") continue;
          this.validateFieldNames(key);
          rows.push(`${key} = ?`);
          bind.push(element);
        }
      }
      sql += rows.join(" , ");
      sql += " WHERE id = " + id;
      const result = await this._dbConnection.query(sql, {
        replacements: bind,
      });

      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async updateWhere(payload, condition) {
    try {
      let sql = "UPDATE " + this._table + " SET ";
      let setRows = [];
      let bind = [];

      // Part: Constructing SET Clause
      for (const key in payload) {
        if (Object.hasOwnProperty.call(payload, key)) {
          let element = payload[key];

          switch (typeof element) {
            case "bigint":
              break;
            case "number":
              break;
            case "string":
              element = element;
              break;
            case "boolean":
              element = element;
              break;

            case "object": // Note: Assuming JSON
              if (element !== null) element = `${JSON.stringify(element)}`;
              break;

            default:
              element = element;
              break;
          }

          this.validateFieldNames(key);
          // setRows.push(`${key} = ${element}`);
          setRows.push(`${key} = ?`);
          bind.push(element);
        }
      }

      sql += setRows.join(" , ");
      sql += " WHERE ";

      // Part: Constructing WHERE Clause
      const whereRows = [];
      for (const key in condition) {
        if (Object.hasOwnProperty.call(condition, key)) {
          let element = condition[key];

          switch (typeof element) {
            case "bigint":
              break;
            case "number":
              break;
            case "boolean":
              element = element;
              break;

            default:
              element = element;
              break;
          }
          this.validateFieldNames(key);
          whereRows.push(`${key} = ?`);
          bind.push(element);
        }
      }

      sql += whereRows.join(" AND ");

      const result = await this._dbConnection.query(sql, {
        replacements: bind,
        type: QueryTypes.UPDATE,
      });

      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(payload, id) {
    try {
      let sql = "DELETE FROM " + this._table + " WHERE ";
      let rows = ["id = ?"];
      let bind = [id];

      for (const key in payload) {
        if (Object.hasOwnProperty.call(payload, key)) {
          this.validateFieldNames(key);
          const element = payload[key];

          rows.push(`${key} = ?`);
          bind.push(element);
        }
      }

      sql += rows.join(" AND ");
      const result = await this._dbConnection.query(sql, {
        replacements: bind,
      });

      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteWhere(payload) {
    try {
      let sql = "DELETE FROM " + this._table + " WHERE ";
      let rows = [];
      let bind = [];

      for (const key in payload) {
        if (Object.hasOwnProperty.call(payload, key)) {
          const element = payload[key];
          this.validateFieldNames(key);
          rows.push(`${key} = ?`);
          bind.push(element);
        }
      }

      sql += rows.join(" AND ");
      const result = await this._dbConnection.query(sql, {
        replacements: bind,
      });

      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async rawQuery(sql) {
    // When using this function be aware of sql injection. Do a proper validation
    // To avoid, one best practice is to use parameterized query with binding.

    const result = await this._dbConnection.query(
      `
    SET SESSION sql_mode='';
    use ${this._database}; ${sql}`,
      {
        raw: false,
      }
    );
    if (result.length > 0) {
      return result[1][2] ?? [];
    } else {
      return [];
    }
  }
};
