const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { LESSON_STATUSES } = require("../utils/mappings");
const { upload, uploadToBunny } = require("../config/bunnyStream");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/modules/{module_id}/lessons:
     *   post:
     *     summary: Create a lesson in a module
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: module_id
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
     *               - name
     *               - order_number
     *             properties:
     *               name:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [draft, published]
     *               description:
     *                 type: string
     *               order_number:
     *                 type: integer
     *               estimated_duration:
     *                 type: integer
     *               is_required:
     *                 type: boolean
     *               text:
     *                 type: string
     *               video_guid:
     *                 type: string
     *     responses:
     *       '201':
     *         description: Lesson created successfully
     */
    app.post(
        "/v1/api/modules/:module_id/lessons",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { module_id } = req.params;
                const {
                    name,
                    status,
                    description,
                    order_number,
                    estimated_duration,
                    is_required = true,
                    text,
                    video_guid,
                } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        module_id: "required|integer",
                        name: "required|string",
                        status: "required|string",
                        description: "string",
                        order_number: "required|integer",
                        estimated_duration: "integer",
                    },
                    { module_id, name, status, description, order_number, estimated_duration }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programme_modules");
                const module = (await sdk.get({ id: module_id }))[0];

                if (!module) {
                    return res.status(404).json({
                        error: true,
                        message: "Module not found",
                    });
                }

                // Create lesson
                sdk.setTable("module_lessons");
                const lesson_id = await sdk.insert({
                    module_id,
                    name,
                    status,
                    description,
                    order_number,
                    estimated_duration,
                    is_required,
                    text,
                    video_guid,
                });

                return res.status(201).json({
                    error: false,
                    message: "Lesson created successfully",
                    lesson_id,
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
     * /v1/api/modules/{module_id}/lessons:
     *   get:
     *     summary: Get all lessons in a module
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: module_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lessons fetched successfully
     */
    app.get(
        "/v1/api/modules/:module_id/lessons",
        [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
        async function (req, res) {
            try {
                const { module_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { module_id: "required|integer" },
                    { module_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("module_lessons");
                const lessons = await sdk.get({ module_id }, "*", "order_number", "ASC");

                return res.status(200).json({
                    error: false,
                    message: "Lessons fetched successfully",
                    lessons,
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
     * /v1/api/lessons/{lesson_id}:
     *   get:
     *     summary: Get a single lesson
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lesson fetched successfully
     */
    app.get(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { lesson_id: "required|integer" },
                    { lesson_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("module_lessons");
                const lesson = (await sdk.get({ id: lesson_id }))[0];

                if (!lesson) {
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found",
                    });
                }

                return res.status(200).json({
                    error: false,
                    message: "Lesson fetched successfully",
                    lesson,
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
     * /v1/api/lessons/{lesson_id}:
     *   put:
     *     summary: Update a lesson
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [draft, published]
     *               description:
     *                 type: string
     *               order_number:
     *                 type: integer
     *               estimated_duration:
     *                 type: integer
     *               is_required:
     *                 type: boolean
     *               text:
     *                 type: string
     *               video_guid:
     *                 type: string
     *               media:
     *                 type: string
     *                 format: binary
     *     responses:
     *       '200':
     *         description: Lesson updated successfully
     */
    app.put(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" }), upload.single("video")],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { name, status, description, order_number, estimated_duration, is_required, text, video_guid } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|integer",
                        name: "string",
                        status: "string",
                        description: "string",
                        order_number: "integer",
                        estimated_duration: "integer",
                    },
                    { lesson_id, name, status, description, order_number, estimated_duration }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("module_lessons");
                const lesson = (await sdk.get({ id: lesson_id }))[0];

                if (!lesson) {
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found",
                    });
                }

                let media = lesson.media;
                let current_video_guid = video_guid || lesson.video_guid;
                let final_duration = estimated_duration || lesson.estimated_duration;

                if (req.file) {
                    const uploadResult = await uploadToBunny(req.file.buffer, {
                        title: name || lesson.name,
                    });
                    media = uploadResult.playbackUrl;
                    current_video_guid = uploadResult.videoId;

                    // Extract duration if available (Bunny returns it in bunnyVideoObject.length or similar)
                    if (uploadResult.bunnyVideoObject && uploadResult.bunnyVideoObject.length) {
                        final_duration = Math.ceil(uploadResult.bunnyVideoObject.length / 60); // Convert seconds to minutes
                    }
                }

                await sdk.update(
                    {
                        ...(name !== undefined ? { name } : {}),
                        ...(status !== undefined ? { status } : {}),
                        ...(description !== undefined ? { description } : {}),
                        ...(order_number !== undefined ? { order_number } : {}),
                        ...(final_duration !== undefined ? { estimated_duration: final_duration } : {}),
                        ...(is_required !== undefined ? { is_required } : {}),
                        ...(text !== undefined ? { text } : {}),
                        ...(current_video_guid !== undefined ? { video_guid: current_video_guid } : {}),
                        media,
                    },
                    lesson_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Lesson updated successfully",
                    lesson: {
                        id: lesson_id,
                        media,
                        video_guid: current_video_guid,
                        estimated_duration: final_duration
                    }
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
     * /v1/api/lessons/{lesson_id}/complete:
     *   post:
     *     summary: Mark a lesson as completed
     *     tags: [Lessons]
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
     *               - cohort_id
     *             properties:
     *               cohort_id:
     *                 type: integer
     *     responses:
     *       '200':
     *         description: Lesson marked as completed
     */
    app.post(
        "/v1/api/lessons/:lesson_id/complete",
        [UrlMiddleware, TokenMiddleware({ role: "learner" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { cohort_id } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|integer",
                        cohort_id: "required|integer",
                    },
                    { lesson_id, cohort_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();

                // Check if already completed
                sdk.setTable("lesson_progress");
                const existing = await sdk.get({
                    user_id: req.user_id,
                    lesson_id,
                    cohort_id,
                });

                if (existing.length > 0) {
                    // Update existing record
                    await sdk.update(
                        {
                            completed: true,
                            completed_at: new Date(),
                        },
                        existing[0].id
                    );
                } else {
                    // Create new record
                    await sdk.insert({
                        user_id: req.user_id,
                        lesson_id,
                        cohort_id,
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
                    message: "something went wrong",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}:
     *   delete:
     *     summary: Delete a lesson
     *     tags: [Lessons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Lesson deleted successfully
     */
    app.delete(
        "/v1/api/lessons/:lesson_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { lesson_id: "required|integer" },
                    { lesson_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("module_lessons");
                const lesson = (await sdk.get({ id: lesson_id }))[0];

                if (!lesson) {
                    return res.status(404).json({
                        error: true,
                        message: "Lesson not found",
                    });
                }

                // Delete lesson (cascade will handle content and progress)
                await sdk.deleteWhere({ id: lesson_id });

                return res.status(200).json({
                    error: false,
                    message: "Lesson deleted successfully",
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
