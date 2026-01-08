const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");

module.exports = function (app) {
    // Get activity logs
    app.get(
        "/v1/api/activities",
        [UrlMiddleware, TokenMiddleware({ role: "convener" })],
        async function (req, res) {
            try {
                const { programme_id, cohort_id, user_id, limit = 50 } = req.query;

                const sdk = new BackendSDK();
                let sql = `
          SELECT al.*, u.first_name, u.last_name, u.profile_image
          FROM activity_logs al
          JOIN users u ON al.user_id = u.id
          WHERE 1=1
        `;

                if (programme_id) sql += ` AND al.programme_id = ${programme_id}`;
                if (cohort_id) sql += ` AND al.cohort_id = ${cohort_id}`;
                if (user_id) sql += ` AND al.user_id = ${user_id}`;

                sql += ` ORDER BY al.created_at DESC LIMIT ${parseInt(limit)}`;

                const activities = await sdk.rawQuery(sql);

                return res.status(200).json({
                    error: false,
                    message: "Activity logs fetched successfully",
                    activities,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: true, message: "Internal server error" });
            }
        },
    );
};
