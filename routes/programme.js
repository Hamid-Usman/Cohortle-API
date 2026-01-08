const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { PROGRAMME_TYPES, PROGRAMME_STATUSES } = require("../utils/mappings");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/communities/{community_id}/programmes:
     *   post:
     *     summary: Create a programme in a community
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: community_id
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
     *               - type
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [scheduled, structured, self_paced]
     *               start_date:
     *                 type: string
     *                 format: date
     *               end_date:
     *                 type: string
     *                 format: date
     *               thumbnail:
     *                 type: string
     *     responses:
     *       '201':
     *         description: Programme created successfully
     */
    app.post(
        "/v1/api/communities/:community_id/programmes",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { community_id } = req.params;
                const { name, description, type, start_date, end_date, thumbnail } =
                    req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        community_id: "required|integer",
                        name: "required|string",
                        description: "string",
                        type: `required|in:${Object.values(PROGRAMME_TYPES).join(",")}`,
                        start_date: "date",
                        end_date: "date",
                    },
                    {
                        community_id,
                        name,
                        description,
                        type,
                        start_date,
                        end_date,
                    }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("communities");
                const community = (await sdk.get({ id: community_id }))[0];

                if (!community) {
                    return res.status(404).json({
                        error: true,
                        message: "Community not found",
                    });
                }

                // Verify ownership
                if (community.owner_id !== req.user_id) {
                    return res.status(403).json({
                        error: true,
                        message: "You do not have permission to create programmes in this community",
                    });
                }

                sdk.setTable("programmes");
                const programme_id = await sdk.insert({
                    community_id,
                    name,
                    description,
                    type,
                    start_date,
                    end_date,
                    thumbnail,
                    created_by: req.user_id,
                    status: PROGRAMME_STATUSES.DRAFT,
                });

                return res.status(201).json({
                    error: false,
                    message: "Programme created successfully",
                    programme_id,
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
     * /v1/api/communities/{community_id}/programmes:
     *   get:
     *     summary: Get all programmes for a community
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: community_id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       '200':
     *         description: List of programmes
     */
    app.get(
        "/v1/api/communities/:community_id/programmes",
        [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
        async function (req, res) {
            try {
                const { community_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { community_id: "required|integer" },
                    { community_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("communities");
                const community = (await sdk.get({ id: community_id }))[0];

                if (!community) {
                    return res.status(404).json({
                        error: true,
                        message: "Community not found",
                    });
                }

                sdk.setTable("programmes");
                const programmes = await sdk.get({ community_id });

                return res.status(200).json({
                    error: false,
                    message: "Programmes fetched successfully",
                    programmes,
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
     * /v1/api/programmes/{programme_id}:
     *   get:
     *     summary: Get a single programme
     *     tags: [Programmes]
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
     *         description: Programme fetched successfully
     */
    app.get(
        "/v1/api/programmes/:programme_id",
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
                sdk.setTable("programmes");
                const programme = (await sdk.get({ id: programme_id }))[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                // Get cohorts count
                sdk.setTable("cohorts");
                const cohorts = await sdk.get({ programme_id });
                programme.cohort_count = cohorts.length;

                // Get modules
                sdk.setTable("programme_modules");
                const modules = await sdk.get({ programme_id });
                programme.module_count = modules.length;

                return res.status(200).json({
                    error: false,
                    message: "Programme fetched successfully",
                    programme,
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
     * /v1/api/programmes/{programme_id}:
     *   put:
     *     summary: Update a programme
     *     tags: [Programmes]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: programme_id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               type:
     *                 type: string
     *               start_date:
     *                 type: string
     *               end_date:
     *                 type: string
     *               status:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Programme updated successfully
     */
    app.put(
        "/v1/api/programmes/:programme_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { programme_id } = req.params;
                const { name, description, type, start_date, end_date, status, thumbnail } =
                    req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        programme_id: "required|integer",
                        name: "string",
                        description: "string",
                        type: `in:${Object.values(PROGRAMME_TYPES).join(",")}`,
                        status: `in:${Object.values(PROGRAMME_STATUSES).join(",")}`,
                        start_date: "date",
                        end_date: "date",
                    },
                    { programme_id, name, description, type, start_date, end_date, status }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programmes");
                const programme = (
                    await sdk.get({ id: programme_id, created_by: req.user_id })
                )[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                await sdk.update(
                    {
                        ...(name !== undefined ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                        ...(type !== undefined ? { type } : {}),
                        ...(start_date !== undefined ? { start_date } : {}),
                        ...(end_date !== undefined ? { end_date } : {}),
                        ...(status !== undefined ? { status } : {}),
                        ...(thumbnail !== undefined ? { thumbnail } : {}),
                    },
                    programme_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Programme updated successfully",
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
     * /v1/api/programmes/{programme_id}:
     *   delete:
     *     summary: Delete a programme
     *     tags: [Programmes]
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
     *         description: Programme deleted successfully
     */
    app.delete(
        "/v1/api/programmes/:programme_id",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
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
                sdk.setTable("programmes");
                const programme = (
                    await sdk.get({ id: programme_id, created_by: req.user_id })
                )[0];

                if (!programme) {
                    return res.status(404).json({
                        error: true,
                        message: "Programme not found",
                    });
                }

                // Delete programme (cascade will handle cohorts, modules, etc.)
                await sdk.deleteWhere({ id: programme_id, created_by: req.user_id });

                return res.status(200).json({
                    error: false,
                    message: "Programme deleted successfully",
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
