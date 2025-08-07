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

const COMMUNITY_TYPES = ["course"];

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
};
