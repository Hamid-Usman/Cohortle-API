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

    return [];
};
