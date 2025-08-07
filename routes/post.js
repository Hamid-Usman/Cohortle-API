const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { POST_STATUSES, POST_REPLY } = require("../utils/mappings");

module.exports = function (app) {
  // create post
  app.post(
    "/v1/api/posts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const {
          text,
          media_1,
          media_2,
          media_3,
          media_4,
          community_ids,
          mentioned_ids,
          can_reply,
        } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            text: "required|string",
            media_1: "url",
            media_2: "url",
            media_3: "url",
            media_4: "url",
            community_ids: "commaInt",
            mentioned_ids: "commaInt",
            can_reply: `required|in:${Object.values(POST_REPLY).join(",")}`,
          },
          {
            text,
            media_1,
            media_2,
            media_3,
            media_4,
            community_ids,
            mentioned_ids,
            can_reply,
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const post_id = await sdk.insert({
          text,
          media_1,
          media_2,
          media_3,
          media_4,
          community_ids,
          mentioned_ids,
          posted_by: req.user_id,
          can_reply,
          status: POST_STATUSES.PUBLISHED,
        });

        // TODO: might need to notify the learners that a new post has been added

        return res.status(200).json({
          error: false,
          message: "post created successfully",
          post_id,
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  );

  return [];
};
