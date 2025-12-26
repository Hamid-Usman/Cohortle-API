const USER_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

const COHORT_STATUSES = {
  ACTIVE: "active",
};

const COMMUNITY_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
};

const COMMUNITY_TYPES = ["course", "public"];

const COMMUNITY_SUB_TYPES = {
  SELF_PACED: "self_paced",
  structured: "structured",
  scheduled: "scheduled",
};

const COHORT_LEARNER_STATUS = {
  ACTIVE: "active",
  RESTRICTED: "restricted",
};

const MODULE_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
};

const LESSON_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
};

const POST_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

const POST_REPLY = {
  EVERYONE: "everyone",
  NOBODY: "nobody",
  PEOPLE_MENTIONED: "people_mentioned",
};

const PROGRAMME_TYPES = {
  SCHEDULED: "scheduled",
  STRUCTURED: "structured",
  SELF_PACED: "self_paced",
};

const PROGRAMME_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

const MEMBER_ROLES = {
  LEARNER: "learner",
  INSTRUCTOR: "instructor",
  FACILITATOR: "facilitator",
};

const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: "announcement",
  DISCUSSION: "discussion",
  LESSON: "lesson",
  PROGRESS: "progress",
  SYSTEM: "system",
};

const ANNOUNCEMENT_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const ACTIVITY_ACTION_TYPES = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ENROLL: "enroll",
  COMPLETE: "complete",
  COMMENT: "comment",
  ANNOUNCE: "announce",
};

const ACTIVITY_ENTITY_TYPES = {
  COMMUNITY: "community",
  PROGRAMME: "programme",
  COHORT: "cohort",
  MODULE: "module",
  LESSON: "lesson",
  MEMBER: "member",
  DISCUSSION: "discussion",
  ANNOUNCEMENT: "announcement",
};

module.exports = {
  USER_STATUSES,
  COHORT_STATUSES,
  COHORT_LEARNER_STATUS,
  COMMUNITY_STATUSES,
  COMMUNITY_TYPES,
  COMMUNITY_SUB_TYPES,
  MODULE_STATUSES,
  LESSON_STATUSES,
  POST_STATUSES,
  POST_REPLY,
  PROGRAMME_TYPES,
  PROGRAMME_STATUSES,
  MEMBER_ROLES,
  NOTIFICATION_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ACTIVITY_ACTION_TYPES,
  ACTIVITY_ENTITY_TYPES,
};
