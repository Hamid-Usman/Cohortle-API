const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");

module.exports = function (app) {
  app.post(
    "/v1/api/lessons/:lesson_id/complete",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
      try {
        const { lesson_id } = req.params;
        const { user_id } = req;

        const sdk = new BackendSDK();

        // 🔹 Find the lesson and cohort
        const lesson = (
          await sdk.rawQuery(
            `SELECT ml.*, cm.community_id, c.cohort_id
                FROM module_lessons ml
                JOIN community_modules cm ON ml.module_id = cm.id
                JOIN communities c ON cm.community_id = c.id
                WHERE ml.id = ${lesson_id}`,
          )
        )[0];

        if (!lesson) {
          return res.status(404).json({
            error: true,
            message: "Lesson not found",
          });
        }

        // 🔹 Verify learner is part of the cohort
        const isMember = await ensureLearnerInCohort(
          sdk,
          user_id,
          lesson.cohort_id,
        );
        if (!isMember) {
          return res.status(403).json({
            error: true,
            message: "Access denied — not part of this cohort.",
          });
        }

        // 🔹 Mark completion
        sdk.setTable("lesson_progress");
        const existing = await sdk.get({
          learner_id: user_id,
          lesson_id,
          cohort_id: lesson.cohort_id,
        });

        if (existing.length) {
          await sdk.update(existing[0].id, {
            completed: true,
            completed_at: new Date(),
          });
        } else {
          await sdk.create({
            learner_id: user_id,
            lesson_id,
            cohort_id: lesson.cohort_id,
            completed: true,
            completed_at: new Date(),
          });
        }

        return res.status(200).json({
          error: false,
          message: "Lesson marked as completed",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "Something went wrong",
        });
      }
    },
  );

  return [];
};
