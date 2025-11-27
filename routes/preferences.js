const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
  app.get(
    "/v1/api/preferences",
    [UrlMiddleware, TokenMiddleware({ allowNull: true })],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        sdk.setTable("preferences");
        let preferences = (await sdk.get({ user_id: req.user_id }))[0];

        if (!preferences) {
          preferences = {
            email_updates: 1,
            new_posts: 1,
            new_course_content: 1,
            new_polls: 1,
            mentions: 0,
            replies_on_post: 0,
            user_id: req.user_id,
          };
          await sdk.insert(preferences);
        }

        return res.status(200).json({
          error: false,
          message: "preferences fetched successfully",
          preferences,
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
      }
    },
  );

  app.put(
    "/v1/api/preferences",
    [UrlMiddleware, TokenMiddleware({ role: "learner|convener" })],
    async function (req, res) {
      try {
        const {
          email_updates,
          new_posts,
          new_course_content,
          new_polls,
          mentions,
          replies_on_post,
        } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            email_updates: "integer",
            new_posts: "integer",
            new_course_content: "integer",
            new_polls: "integer",
            mentions: "integer",
            replies_on_post: "integer",
          },
          {
            email_updates,
            new_posts,
            new_course_content,
            new_polls,
            mentions,
            replies_on_post,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("preferences");
        await sdk.updateWhere(
          {
            ...(email_updates !== undefined ? { email_updates } : {}),
            ...(new_posts !== undefined ? { new_posts } : {}),
            ...(new_course_content !== undefined ? { new_course_content } : {}),
            ...(new_polls !== undefined ? { new_polls } : {}),
            ...(mentions !== undefined ? { mentions } : {}),
            ...(replies_on_post !== undefined ? { replies_on_post } : {}),
          },
          { user_id: req.user_id },
        );

        return res.status(200).json({
          error: false,
          message: "preferences updated successfully",
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
      }
    },
  );

  return [];
};
