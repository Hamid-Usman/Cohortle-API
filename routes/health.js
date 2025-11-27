const BackendSDK = require("../core/BackendSDK");
const UrlMiddleware = require("../middleware/UrlMiddleware");

module.exports = function (app) {
  app.get("/v1/api/health", [UrlMiddleware], async function (req, res) {
    try {
      const sdk = new BackendSDK();
      const result = (await sdk.rawQuery("SELECT NOW() AS db_time"))[0];
      return res.status(200).json({
        error: false,
        message: "Ping successful",
        db_time: result.db_time,
      });
    } catch (err) {
      console.error(err);
      res.status(500);
      res.json({
        error: true,
        message: "something went wrong",
      });
    }
  });

  return [];
};
