const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    // Create discussion
    app.post(
        "/v1/api/discussions",
        [UrlMiddleware, TokenMiddleware({ role: 'convener|learner' })],
        async function (req, res) {
            try {
                const { cohort_id, title, description } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        title: "required|string",
                        description: "string",
                        cohort_id: "required|integer",
                    },
                    req.body,
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("discussions");
                const discussion_id = await sdk.insert({
                    cohort_id,
                    title,
                    description,
                    created_by: req.user_id,
                });

                // Activity log
                const activitySdk = new BackendSDK();
                activitySdk.setTable("activity_logs");
                await activitySdk.insert({
                    user_id: req.user_id,
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
        [UrlMiddleware, TokenMiddleware({ role: 'convener|learner' })],
        async function (req, res) {
            try {
                const { cohort_id } = req.query;

                const validationResult = await ValidationService.validateObject(
                    {
                        cohort_id: "required|integer",
                    },
                    req.query
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                let query = { cohort_id };

                const sdkTable = new BackendSDK();
                sdkTable.setTable("discussions");
                const discussions = await sdkTable.get(query);

                // Fetch user data for each discussion
                const userSdk = new BackendSDK();
                userSdk.setTable("users");

                const discussionsWithUsers = await Promise.all(
                    discussions.map(async (discussion) => {
                        const [user] = await userSdk.get({ id: discussion.created_by });

                        const userData = user
                            ? {
                                first_name: user.first_name,
                                last_name: user.last_name,
                                profile_image: user.profile_image,
                            }
                            : null;

                        return {
                            ...discussion,
                            user: userData,
                        };
                    })
                );

                return res.status(200).json({
                    error: false,
                    message: "Discussions fetched successfully",
                    discussions: discussionsWithUsers,
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
        [UrlMiddleware, TokenMiddleware({ role: 'convener|learner' })],
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

    // Get comments for a discussion
    app.get(
        "/v1/api/discussions/:discussion_id/comments",
        [UrlMiddleware, TokenMiddleware({ role: 'convener|learner' })],
        async function (req, res) {
            try {
                const { discussion_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { discussion_id: "required|integer" },
                    { discussion_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("discussion_comments");
                const comments = await sdk.get({ discussion_id });

                const userSdk = new BackendSDK();
                userSdk.setTable("users");

                const commentsWithUsers = await Promise.all(
                    comments.map(async (comment) => {
                        const [user] = await userSdk.get({ id: comment.user_id });

                        const userData = user
                            ? {
                                first_name: user.first_name,
                                last_name: user.last_name,
                                profile_image: user.profile_image,
                            }
                            : null;

                        return {
                            ...comment,
                            user: userData,
                        };
                    })
                );

                return res.status(200).json({
                    error: false,
                    message: "Comments fetched successfully",
                    comments: commentsWithUsers,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        }
    );
};
