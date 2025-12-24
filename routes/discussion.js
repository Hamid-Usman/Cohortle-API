const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    // Create discussion
    app.post(
        "/v1/api/discussions",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { programme_id, cohort_id, lesson_id, title, description } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        title: "required|string",
                        description: "string",
                        programme_id: "integer",
                        cohort_id: "integer",
                        lesson_id: "integer",
                    },
                    req.body,
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("discussions");
                const discussion_id = await sdk.insert({
                    programme_id,
                    cohort_id,
                    lesson_id,
                    title,
                    description,
                    created_by: req.user_id,
                });

                // Activity log
                const activitySdk = new BackendSDK();
                activitySdk.setTable("activity_logs");
                await activitySdk.insert({
                    user_id: req.user_id,
                    programme_id,
                    cohort_id,
                    action_type: "create",
                    entity_type: "discussion",
                    entity_id: discussion_id,
                    description: `Created a discussion: ${title}`,
                });

                return res.status(200).json({
                    error: false,
                    message: "Discussion created successfully",
                    discussion_id,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Get discussions
    app.get(
        "/v1/api/discussions",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { programme_id, cohort_id, lesson_id } = req.query;

                const sdk = new BackendSDK();
                let query = {};
                if (programme_id) query.programme_id = programme_id;
                if (cohort_id) query.cohort_id = cohort_id;
                if (lesson_id) query.lesson_id = lesson_id;

                const sdkTable = new BackendSDK();
                sdkTable.setTable("discussions");
                const discussions = await sdkTable.get(query);

                return res.status(200).json({
                    error: false,
                    message: "Discussions fetched successfully",
                    discussions,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );

    // Add comment to discussion
    app.post(
        "/v1/api/discussions/:discussion_id/comments",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { discussion_id } = req.params;
                const { comment_text, parent_comment_id } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        comment_text: "required|string",
                        discussion_id: "required|integer",
                        parent_comment_id: "integer",
                    },
                    { comment_text, discussion_id, parent_comment_id },
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("discussion_comments");
                const comment_id = await sdk.insert({
                    discussion_id,
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
};
