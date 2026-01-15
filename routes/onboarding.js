const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/onboarding/programme-intent:
     *   post:
     *     summary: Store programme intent survey data
     *     tags: [Onboarding]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - programme_type
     *               - expected_cohort_size
     *               - programme_duration
     *               - mode
     *             properties:
     *               programme_type:
     *                 type: string
     *                 example: Fellowship
     *               expected_cohort_size:
     *                 type: string
     *                 example: 21–50
     *               programme_duration:
     *                 type: string
     *                 example: 12 Weeks
     *               mode:
     *                 type: string
     *                 example: Online
     *     responses:
     *       201:
     *         description: Programme intent stored successfully
     *       400:
     *         description: Validation error
     *       500:
     *         description: Server error
     */
    app.post(
        "/v1/api/onboarding/programme-intent",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const {
                    programme_type,
                    expected_cohort_size,
                    programme_duration,
                    mode,
                } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        programme_type: "required|string",
                        expected_cohort_size: "required|string",
                        programme_duration: "required|string",
                        mode: "required|string",
                    },
                    {
                        programme_type,
                        expected_cohort_size,
                        programme_duration,
                        mode,
                    },
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("programme_intents");

                const intent_id = await sdk.insert({
                    user_id: req.user_id,
                    programme_type,
                    expected_cohort_size,
                    programme_duration,
                    mode,
                });

                return res.status(201).json({
                    error: false,
                    message: "Programme intent stored successfully",
                    intent_id,
                });
            } catch (err) {
                console.error("Programme intent error:", err);
                res.status(500).json({
                    error: true,
                    message: "Something went wrong",
                });
            }
        },
    );

    /**
     * @swagger
     * /v1/api/onboarding/context:
     *   post:
     *     summary: Store partner context survey data
     *     tags: [Onboarding]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               learner_types:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["Students", "Founders"]
     *               biggest_challenges:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["Managing participants", "Engagement"]
     *     responses:
     *       200:
     *         description: Partner context stored successfully
     *       400:
     *         description: Validation error
     *       500:
     *         description: Server error
     */
    app.post(
        "/v1/api/onboarding/context",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { learner_types, biggest_challenges } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        learner_types: "array",
                        biggest_challenges: "array",
                    },
                    {
                        learner_types,
                        biggest_challenges,
                    },
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const sdk = new BackendSDK();
                sdk.setTable("partner_contexts");

                // Check if exists for user
                const existing = await sdk.get({ user_id: req.user_id });

                const payload = {
                    learner_types: learner_types ? JSON.stringify(learner_types) : undefined,
                    biggest_challenges: biggest_challenges ? JSON.stringify(biggest_challenges) : undefined,
                };

                if (existing.length > 0) {
                    await sdk.update(payload, existing[0].id);
                } else {
                    await sdk.insert({
                        user_id: req.user_id,
                        learner_types: payload.learner_types || "[]",
                        biggest_challenges: payload.biggest_challenges || "[]",
                    });
                }

                return res.status(200).json({
                    error: false,
                    message: "Partner context stored successfully",
                });
            } catch (err) {
                console.error("Partner context error:", err);
                res.status(500).json({
                    error: true,
                    message: "Something went wrong",
                });
            }
        },
    );

    return [];
};
