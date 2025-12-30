const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    // Create programme announcement
    app.post(
        "/v1/api/programmes/:programme_id/announcements",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { title, content, priority } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        title: "required|string",
                        content: "required|string",
                        priority: "in:low,medium,high",
                        programme_id: "required|integer",
                    },
                    { title, content, priority, programme_id },
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("announcements");
                const announcement_id = await sdk.insert({
                    programme_id,
                    title,
                    content,
                    priority: priority || "medium",
                    created_by: req.user_id,
                    published_at: new Date(),
                });

                // Activity log
                const activitySdk = new BackendSDK();
                activitySdk.setTable("activity_logs");
                await activitySdk.insert({
                    user_id: req.user_id,
                    programme_id,
                    action_type: "announce",
                    entity_type: "announcement",
                    entity_id: announcement_id,
                    description: `Created a programme announcement: ${title}`,
                });

                return res.status(200).json({
                    error: false,
                    message: "Announcement created successfully",
                    announcement_id,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Create cohort announcement
    app.post(
        "/v1/api/cohorts/:cohort_id/announcements",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { cohort_id } = req.params;
                const { title, content, priority } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        title: "required|string",
                        content: "required|string",
                        priority: "in:low,medium,high",
                        cohort_id: "required|integer",
                    },
                    { title, content, priority, cohort_id },
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("announcements");
                const announcement_id = await sdk.insert({
                    cohort_id,
                    title,
                    content,
                    priority: priority || "medium",
                    created_by: req.user_id,
                    published_at: new Date(),
                });

                // Activity log
                const activitySdk = new BackendSDK();
                activitySdk.setTable("activity_logs");
                await activitySdk.insert({
                    user_id: req.user_id,
                    cohort_id,
                    action_type: "announce",
                    entity_type: "announcement",
                    entity_id: announcement_id,
                    description: `Created a cohort announcement: ${title}`,
                });

                return res.status(200).json({
                    error: false,
                    message: "Announcement created successfully",
                    announcement_id,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Get announcements for a programme
    app.get(
        "/v1/api/programmes/:programme_id/announcements",
        [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;

                const sdk = new BackendSDK();
                const sql = `
          SELECT a.*, u.first_name, u.last_name, u.profile_image
          FROM announcements a
          JOIN users u ON a.created_by = u.id
          WHERE a.programme_id = ${programme_id} OR a.cohort_id IN (
            SELECT id FROM cohorts WHERE programme_id = ${programme_id}
          )
          ORDER BY a.created_at DESC
        `;
                const announcements = await sdk.rawQuery(sql);

                return res.status(200).json({
                    error: false,
                    message: "Announcements fetched successfully",
                    announcements,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Get announcements for a cohort
    app.get(
        "/v1/api/cohorts/:cohort_id/announcements",
        [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
        async function (req, res) {
            try {
                const { cohort_id } = req.params;

                const sdk = new BackendSDK();
                const sql = `
          SELECT a.*, u.first_name, u.last_name, u.profile_image
          FROM announcements a
          JOIN users u ON a.created_by = u.id
          WHERE a.cohort_id = ${cohort_id}
          ORDER BY a.created_at DESC
        `;
                const announcements = await sdk.rawQuery(sql);

                return res.status(200).json({
                    error: false,
                    message: "Announcements fetched successfully",
                    announcements,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Delete announcement
    app.delete(
        "/v1/api/announcements/:announcement_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { announcement_id } = req.params;

                const sdk = new BackendSDK();
                sdk.setTable("announcements");
                await sdk.deleteWhere({ id: announcement_id });

                return res.status(200).json({
                    error: false,
                    message: "Announcement deleted successfully",
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Add comment to announcement
    app.post(
        "/v1/api/announcements/:announcement_id/comments",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { announcement_id } = req.params;
                const { comment_text, parent_comment_id } = req.body;

                const sdk = new BackendSDK();
                sdk.setTable("announcement_comments");
                const comment_id = await sdk.insert({
                    announcement_id,
                    user_id: req.user_id,
                    comment_text,
                    parent_comment_id,
                });

                return res.status(200).json({
                    error: false,
                    message: "Comment added successfully",
                    comment_id,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Get comments for announcement
    app.get(
        "/v1/api/announcements/:announcement_id/comments",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { announcement_id } = req.params;

                const sdk = new BackendSDK();
                const sql = `
          SELECT ac.*, u.first_name, u.last_name, u.profile_image
          FROM announcement_comments ac
          JOIN users u ON ac.user_id = u.id
          WHERE ac.announcement_id = ${announcement_id}
          ORDER BY ac.created_at ASC
        `;
                const comments = await sdk.rawQuery(sql);

                return res.status(200).json({
                    error: false,
                    message: "Comments fetched successfully",
                    comments,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );
};
