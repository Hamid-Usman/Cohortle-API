var DataTypes = require("sequelize").DataTypes;
var _activity_logs = require("./activity_logs");
var _announcement_comments = require("./announcement_comments");
var _announcements = require("./announcements");
var _cohort_members = require("./cohort_members");
var _cohorts = require("./cohorts");
var _communities = require("./communities");
var _community_members = require("./community_members");
var _programme_modules = require("./programme_modules");
var _discussion_comments = require("./discussion_comments");
var _discussions = require("./discussions");
var _lessonProgress = require("./lessonProgress");
var _lesson_schedule = require("./lesson_schedule");
var _module_lessons = require("./module_lessons");
var _partner_contexts = require("./partner_contexts");
var _lesson_comments = require("./lesson_comments");
var _programme_progress = require("./programme_progress");
var _programmes = require("./programmes");
var _programme_intents = require("./programme_intents");
var _users = require("./users");

function initModels(sequelize) {
  var activity_logs = _activity_logs(sequelize, DataTypes);
  var announcement_comments = _announcement_comments(sequelize, DataTypes);
  var announcements = _announcements(sequelize, DataTypes);
  var cohort_members = _cohort_members(sequelize, DataTypes);
  var cohorts = _cohorts(sequelize, DataTypes);
  var communities = _communities(sequelize, DataTypes);
  var community_members = _community_members(sequelize, DataTypes);
  var programme_modules = _programme_modules(sequelize, DataTypes);
  var discussion_comments = _discussion_comments(sequelize, DataTypes);
  var discussions = _discussions(sequelize, DataTypes);
  var lessonProgress = _lessonProgress(sequelize, DataTypes);
  var lesson_schedule = _lesson_schedule(sequelize, DataTypes);
  var module_lessons = _module_lessons(sequelize, DataTypes);
  var partner_contexts = _partner_contexts(sequelize, DataTypes);
  var lesson_comments = _lesson_comments(sequelize, DataTypes);
  var programme_progress = _programme_progress(sequelize, DataTypes);
  var programmes = _programmes(sequelize, DataTypes);
  var programme_intents = _programme_intents(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  // Community Associations
  communities.belongsTo(users, { as: "owner", foreignKey: "owner_id" });
  users.hasMany(communities, { as: "communities", foreignKey: "owner_id" });

  community_members.belongsTo(communities, { as: "community", foreignKey: "community_id" });
  communities.hasMany(community_members, { as: "community_members", foreignKey: "community_id" });

  community_members.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(community_members, { as: "community_members", foreignKey: "user_id" });

  // Programme Associations
  programmes.belongsTo(communities, { as: "community", foreignKey: "community_id" });
  communities.hasMany(programmes, { as: "programmes", foreignKey: "community_id" });

  programme_modules.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(programme_modules, { as: "modules", foreignKey: "programme_id" });

  // Cohort Associations
  cohorts.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(cohorts, { as: "cohorts", foreignKey: "programme_id" });

  cohort_members.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(cohort_members, { as: "members", foreignKey: "cohort_id" });

  cohort_members.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(cohort_members, { as: "cohort_members", foreignKey: "user_id" });

  // Lesson Associations
  module_lessons.belongsTo(programme_modules, { as: "module", foreignKey: "module_id" });
  programme_modules.hasMany(module_lessons, { as: "lessons", foreignKey: "module_id" });

  // Announcements
  announcements.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(announcements, { as: "announcements", foreignKey: "programme_id" });
  announcements.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(announcements, { as: "announcements", foreignKey: "cohort_id" });
  announcements.belongsTo(users, { as: "creator", foreignKey: "created_by" });

  // Announcement Comments
  announcement_comments.belongsTo(announcements, { as: "announcement", foreignKey: "announcement_id" });
  announcements.hasMany(announcement_comments, { as: "comments", foreignKey: "announcement_id" });
  announcement_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(announcement_comments, { as: "announcement_comments", foreignKey: "user_id" });

  // Discussions
  discussions.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(discussions, { as: "discussions", foreignKey: "programme_id" });
  discussions.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(discussions, { as: "discussions", foreignKey: "cohort_id" });
  discussions.belongsTo(module_lessons, { as: "lesson", foreignKey: "lesson_id" });
  module_lessons.hasMany(discussions, { as: "discussions", foreignKey: "lesson_id" });
  discussions.belongsTo(users, { as: "creator", foreignKey: "created_by" });

  // Discussion Comments
  discussion_comments.belongsTo(discussions, { as: "discussion", foreignKey: "discussion_id" });
  discussions.hasMany(discussion_comments, { as: "comments", foreignKey: "discussion_id" });
  discussion_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(discussion_comments, { as: "discussion_comments", foreignKey: "user_id" });

  // Lesson Schedule
  lesson_schedule.belongsTo(module_lessons, { as: "lesson", foreignKey: "lesson_id" });
  module_lessons.hasMany(lesson_schedule, { as: "schedules", foreignKey: "lesson_id" });
  lesson_schedule.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(lesson_schedule, { as: "schedules", foreignKey: "cohort_id" });

  // Lesson Comments
  lesson_comments.belongsTo(module_lessons, { as: "lesson", foreignKey: "lesson_id" });
  module_lessons.hasMany(lesson_comments, { as: "comments", foreignKey: "lesson_id" });
  lesson_comments.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(lesson_comments, { as: "lesson_comments", foreignKey: "user_id" });
  lesson_comments.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(lesson_comments, { as: "lesson_comments", foreignKey: "cohort_id" });

  // Activity Logs
  activity_logs.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(activity_logs, { as: "activity_logs", foreignKey: "user_id" });

  // Programme Intent Associations
  programme_intents.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(programme_intents, { as: "programme_intents", foreignKey: "user_id" });

  // Partner Context Associations
  partner_contexts.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(partner_contexts, { as: "partner_context", foreignKey: "user_id" });

  // Programme Progress
  programme_progress.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(programme_progress, { as: "progress", foreignKey: "user_id" });
  programme_progress.belongsTo(programmes, { as: "programme", foreignKey: "programme_id" });
  programmes.hasMany(programme_progress, { as: "progress", foreignKey: "programme_id" });
  programme_progress.belongsTo(cohorts, { as: "cohort", foreignKey: "cohort_id" });
  cohorts.hasMany(programme_progress, { as: "progress", foreignKey: "cohort_id" });

  return {
    activity_logs,
    announcement_comments,
    announcements,
    cohort_members,
    cohorts,
    communities,
    community_members,
    programme_modules,
    discussion_comments,
    discussions,
    lessonProgress,
    lesson_schedule,
    module_lessons,
    lesson_comments,
    programme_progress,
    programmes,
    programme_intents,
    partner_contexts,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
