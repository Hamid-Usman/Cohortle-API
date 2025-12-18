var DataTypes = require("sequelize").DataTypes;
var _cohort_members = require("./cohort_members");
var _cohorts = require("./cohorts");
var _communities = require("./communities");
var _community_modules = require("./community_modules");
var _module_lessons = require("./module_lessons");
var _programmes = require("./programmes");
var _users = require("./users");

function initModels(sequelize) {
  var cohort_members = _cohort_members(sequelize, DataTypes);
  var cohorts = _cohorts(sequelize, DataTypes);
  var communities = _communities(sequelize, DataTypes);
  var community_modules = _community_modules(sequelize, DataTypes);
  var module_lessons = _module_lessons(sequelize, DataTypes);
  var programmes = _programmes(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  cohort_members.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(cohort_members, {
    as: "cohort_members",
    foreignKey: "cohort_id",
  });
  communities.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(communities, { as: "communities", foreignKey: "cohort_id" });
  community_modules.belongsTo(communities, {
    as: "community",
    foreignKey: "community_id",
  });
  communities.hasMany(community_modules, {
    as: "community_modules",
    foreignKey: "community_id",
  });
  programmes.belongsTo(communities, {
    as: "community",
    foreignKey: "community_id",
  });
  communities.hasMany(programmes, {
    as: "programmes",
    foreignKey: "community_id",
  });
  module_lessons.belongsTo(community_modules, {
    as: "module",
    foreignKey: "module_id",
  });
  community_modules.hasMany(module_lessons, {
    as: "module_lessons",
    foreignKey: "module_id",
  });
  cohort_members.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(cohort_members, {
    as: "cohort_members",
    foreignKey: "user_id",
  });
  cohorts.belongsTo(users, {
    as: "cohort_owner_user",
    foreignKey: "cohort_owner",
  });
  users.hasMany(cohorts, { as: "cohorts", foreignKey: "cohort_owner" });

  return {
    cohort_members,
    cohorts,
    communities,
    community_modules,
    module_lessons,
    programmes,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
