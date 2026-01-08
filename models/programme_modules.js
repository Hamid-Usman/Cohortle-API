const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "programme_modules",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            programme_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "programmes",
                    key: "id",
                },
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: "active",
            },
            order_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            tableName: "programme_modules",
            timestamps: true,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [{ name: "id" }],
                },
                {
                    name: "idx_programme_id",
                    using: "BTREE",
                    fields: [{ name: "programme_id" }],
                },
            ],
        },
    );
};
