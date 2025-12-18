const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "programmes",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      community_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "communities",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "draft",
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      thumbnail: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "programmes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "community_id",
          using: "BTREE",
          fields: [{ name: "community_id" }],
        },
      ],
    },
  );
};