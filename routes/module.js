const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { MODULE_STATUSES } = require("../utils/mappings");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/programmes/{programme_id}/modules:
     *   post:
     *     summary: Create a module in a programme
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: programme_id
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
     *               - order_number
     *             properties:
     *               title:
     *                 type: string
     *               order_number:
     *                 type: integer
     *     responses:
     *       '201':
     *         description: Module created successfully
     */
    app.post(
        "/v1/api/programmes/:programme_id/modules",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { title, order_number } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        programme_id: "required|integer",
                        title: "required|string",
                        order_number: "required|integer",
                    },
                    { programme_id, title, order_number }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: programme_id }))[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                sdk.setTable("programme_modules");
                const module_id = await sdk.insert({
                    programme_id,
                    title,
                    order_number,
                    status: MODULE_STATUSES.DRAFT,
                });

                return res.status(201).json({
                    error: false,
                    message: "Module created successfully",
                    module_id,
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
     * /v1/api/programmes/{programme_id}/modules:
     *   get:
     *     summary: Get all modules for a programme
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: programme_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: Modules fetched successfully
     */
    app.get(
        "/v1/api/programmes/:programme_id/modules",
        [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { programme_id: "required|integer" },
                    { programme_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programme_modules");
                const modules = await sdk.get({ programme_id }, "*", "order_number", "ASC");

                // Get lesson count for each module
                for (let module of modules) {
                    sdk.setTable("module_lessons");
                    const lessons = await sdk.get({ module_id: module.id });
                    module.lesson_count = lessons.length;
                }

                return res.status(200).json({
                    error: false,
                    message: "Modules fetched successfully",
                    modules,
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
     * /v1/api/modules/{module_id}:
     *   get:
     *     summary: Get a single module with its lessons
     *     tags: [Modules]
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
     *         description: Module fetched successfully
     */
    app.get(
        "/v1/api/modules/:module_id",
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
                sdk.setTable("programme_modules");
                const module = (await sdk.get({ id: module_id }))[0];

                if (!module) {
                    return res.status(404).json({
                        error: true,
                        message: "Module not found",
                    });
                }

                // Get lessons
                sdk.setTable("module_lessons");
                const lessons = await sdk.get({ module_id }, "*", "order_number", "ASC");
                module.lessons = lessons;

                return res.status(200).json({
                    error: false,
                    message: "Module fetched successfully",
                    module,
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
     * /v1/api/modules/{module_id}:
     *   put:
     *     summary: Update a module
     *     tags: [Modules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: module_id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               order_number:
     *                 type: integer
     *               status:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Module updated successfully
     */
    app.put(
        "/v1/api/modules/:module_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { module_id } = req.params;
                const { title, order_number, status } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        module_id: "required|integer",
                        title: "string",
                        order_number: "integer",
                        status: `in:${Object.values(MODULE_STATUSES).join(",")}`,
                    },
                    { module_id, title, order_number, status }
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

                await sdk.update(
                    {
                        ...(title !== undefined ? { title } : {}),
                        ...(order_number !== undefined ? { order_number } : {}),
                        ...(status !== undefined ? { status } : {}),
                    },
                    module_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Module updated successfully",
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
     * /v1/api/modules/{module_id}:
     *   delete:
     *     summary: Delete a module
     *     tags: [Modules]
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
     *         description: Module deleted successfully
     */
    app.delete(
        "/v1/api/modules/:module_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
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
                sdk.setTable("programme_modules");
                const module = (await sdk.get({ id: module_id }))[0];

                if (!module) {
                    return res.status(404).json({
                        error: true,
                        message: "Module not found",
                    });
                }

                // Delete module (cascade will handle lessons)
                await sdk.deleteWhere({ id: module_id });

                return res.status(200).json({
                    error: false,
                    message: "Module deleted successfully",
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
