const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    /**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
    /**
 * @swagger
 * /v1/api/cohorts/{cohort_id}/schedule:
 *   post:
 *     tags:
 *       - Cohort Schedule
 *     summary: Schedule a lesson for a cohort
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohort_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - scheduled_date
 *             properties:
 *               title:
 *                 type: string
 *               meeting_link:
 *                 type: string
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *               scheduled_time:
 *                 type: string
 *                 example: "14:00:00"
 *               duration_minutes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lesson scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 schedule_id:
 *                   type: integer
 *                 title:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
    // Schedule a lesson
    app.post(
        "/v1/api/cohorts/:cohort_id/schedule",
        [TokenMiddleware({ role: "convener" }), UrlMiddleware],
        async function (req, res) {
            try {
                const { cohort_id } = req.params;
                const {
                title,
                meeting_link,
                scheduled_date,
                scheduled_time,
                duration_minutes,
                } = req.body;

                const validationResult = await ValidationService.validateObject(
                {
                    cohort_id: "required|integer",
                    title: "required|string",
                    meeting_link: "string",
                    scheduled_date: "required|date",
                    scheduled_time: "string",
                    duration_minutes: "integer",
                },
                {
                    cohort_id,
                    title,
                    meeting_link,
                    scheduled_date,
                    scheduled_time,
                    duration_minutes,
                },
                );

                if (validationResult.error) {
                return res.status(400).json(validationResult);
                }

                // Validate scheduled_time format (HH:MM or HH:MM:SS)
                if (scheduled_time && !/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(scheduled_time)) {
                    return res.status(400).json({
                        error: true,
                        message: "Invalid scheduled_time format. Expected HH:MM or HH:MM:SS",
                    });
                }

                const sdk = new BackendSDK();
                sdk.setTable("lesson_schedule");

                const schedule_id = await sdk.insert({
                title,
                meeting_link,
                cohort_id,
                scheduled_date,
                scheduled_time,
                duration_minutes,
                });

                // Activity log
                const activitySdk = new BackendSDK();
                activitySdk.setTable("activity_logs");
                await activitySdk.insert({
                user_id: req.user_id,
                cohort_id,
                action_type: "create",
                entity_type: "lesson",
                entity_id: schedule_id,
                description: `Scheduled virtual session: ${title} for cohort ${cohort_id} on ${scheduled_date}`,
                });

                return res.status(201).json({
                    error: false,
                    message: "Lesson scheduled successfully",
                    schedule_id,
                    title,
                });
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY' || (err.original && err.original.code === 'ER_DUP_ENTRY')) {
                    return res.status(409).json({
                        error: true,
                        message: "A session is already scheduled for this time/date.",
                    });
                }
                console.error("Error in POST /schedule:", err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    /**
 * @swagger
 * /v1/api/cohorts/{cohort_id}/schedule:
 *   get:
 *     tags:
 *       - Cohort Schedule
 *     summary: Get scheduled virtual session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohort_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Schedule fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
    // Get schedule for a cohort
    app.get(
        "/v1/api/cohorts/:cohort_id/schedule",
        [TokenMiddleware({role: "convener"}), UrlMiddleware],
        async function (req, res) {
            try {
                const { cohort_id } = req.params;
                const { start_date, end_date } = req.query;

                const validationResult = await ValidationService.validateObject(
                    {
                        cohort_id: "required|integer",
                        start_date: "date",
                        end_date: "date",
                    },
                    {
                        cohort_id,
                        start_date,
                        end_date,
                    }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                let sql = `
          SELECT ls.*
          FROM lesson_schedule ls
          WHERE ls.cohort_id = ${cohort_id}
        `;

                if (start_date && end_date) {
                    sql += ` AND ls.scheduled_date BETWEEN '${start_date}' AND '${end_date}'`;
                }

                sql += ` ORDER BY ls.scheduled_date ASC, ls.scheduled_time ASC`;

                const schedule = await sdk.rawQuery(sql);

                return res.status(200).json({
                    error: false,
                    message: "Schedule fetched successfully",
                    schedule,
                });
            } catch (err) {
                console.error("Error in GET /schedule:", err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );
};
