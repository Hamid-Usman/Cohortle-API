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
        const { cohort_id } = req.body; // Cohort context should be provided

        if (!cohort_id) {
          return res.status(400).json({ error: true, message: "cohort_id is required" });
        }

        const sdk = new BackendSDK();

        // 🔹 Find the lesson and verify it belongs to the programme of the cohort
        const lesson = (
          await sdk.rawQuery(
            `SELECT ml.*, pm.programme_id
                FROM module_lessons ml
                JOIN programme_modules pm ON ml.module_id = pm.id
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
          cohort_id,
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
          user_id,
          lesson_id,
          cohort_id: cohort_id,
        });

        if (existing.length) {
          await sdk.update({
            completed: true,
          }, existing[0].id);
        } else {
          await sdk.insert({
            user_id,
            lesson_id,
            cohort_id: cohort_id,
            completed: true,
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

  async function ensureLearnerInCohort(sdk, user_id, cohort_id) {
    sdk.setTable("cohort_members");
    const member = await sdk.get({ user_id, cohort_id });
    return member.length > 0;
  }
};
