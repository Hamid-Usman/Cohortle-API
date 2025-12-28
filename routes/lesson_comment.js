const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}/comments:
     *   post:
     *     summary: Add a comment to a lesson
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
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
     *               - comment_text
     *             properties:
     *               comment_text:
     *                 type: string
     *               cohort_id:
     *                 type: integer
     *               parent_comment_id:
     *                 type: integer
     *     responses:
     *       '201':
     *         description: Comment added successfully
     */
    app.post(
        "/v1/api/lessons/:lesson_id/comments",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { comment_text, cohort_id, parent_comment_id } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|integer",
                        comment_text: "required|string",
                        cohort_id: "integer",
                        parent_comment_id: "integer",
                    },
                    { lesson_id, comment_text, cohort_id, parent_comment_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("lesson_comments");
                const comment_id = await sdk.insert({
                    lesson_id,
                    user_id: req.user_id,
                    cohort_id,
                    comment_text,
                    parent_comment_id,
                });

                return res.status(201).json({
                    error: false,
                    message: "Comment added successfully",
                    comment_id,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({
                    error: true,
                    message: "something went wrong",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}/comments:
     *   get:
     *     summary: Get all comments for a lesson
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: cohort_id
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Comments fetched successfully
     */
    app.get(
        "/v1/api/lessons/:lesson_id/comments",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.query;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|integer",
                        cohort_id: "integer",
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("lesson_comments");

                const query = { lesson_id };
                if (cohort_id) query.cohort_id = cohort_id;

                const comments = await sdk.get(query, "*", "created_at", "DESC");

                return res.status(200).json({
                    error: false,
                    message: "Comments fetched successfully",
                    comments,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({
                    error: true,
                    message: "something went wrong",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lesson-comments/{comment_id}:
     *   put:
     *     summary: Update a lesson comment
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: comment_id
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
     *               - comment_text
     *             properties:
     *               comment_text:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Comment updated successfully
     */
    app.put(
        "/v1/api/lesson-comments/:comment_id",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { comment_id } = req.params;
                const { comment_text } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        comment_id: "required|integer",
                        comment_text: "required|string",
                    },
                    { comment_id, comment_text }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("lesson_comments");

                const comment = (await sdk.get({ id: comment_id }))[0];
                if (!comment) {
                    return res.status(404).json({
                        error: true,
                        message: "Comment not found",
                    });
                }

                if (comment.user_id !== req.user_id) {
                    return res.status(403).json({
                        error: true,
                        message: "Unauthorized to update this comment",
                    });
                }

                await sdk.update({ comment_text }, comment_id);

                return res.status(200).json({
                    error: false,
                    message: "Comment updated successfully",
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({
                    error: true,
                    message: "something went wrong",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lesson-comments/{comment_id}:
     *   delete:
     *     summary: Delete a lesson comment
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: comment_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Comment deleted successfully
     */
    app.delete(
        "/v1/api/lesson-comments/:comment_id",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { comment_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { comment_id: "required|integer" },
                    { comment_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("lesson_comments");

                const comment = (await sdk.get({ id: comment_id }))[0];
                if (!comment) {
                    return res.status(404).json({
                        error: true,
                        message: "Comment not found",
                    });
                }

                // Allow creator or convener to delete
                const isCreator = comment.user_id === req.user_id;
                const isConvener = req.user_role === "convener";

                if (!isCreator && !isConvener) {
                    return res.status(403).json({
                        error: true,
                        message: "Unauthorized to delete this comment",
                    });
                }

                await sdk.deleteWhere({ id: comment_id });

                return res.status(200).json({
                    error: false,
                    message: "Comment deleted successfully",
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({
                    error: true,
                    message: "something went wrong",
                });
            }
        }
    );

    return [];
};
