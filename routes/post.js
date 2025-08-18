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

  // show all posts on feed
  app.get(
    "/v1/api/posts",
    [UrlMiddleware, TokenMiddleware({role: "learner|convener"})],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const posts = await sdk.get({
          status: POST_STATUSES.PUBLISHED,
          // posted_by: req.user_id,
        });

        return res.status(200).json({
          error: false,
          posts,
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
  )

  // get post
  app.get(
    "v1/api/posts/:post_id",
    [TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;
        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const post = await sdk.get({ id: post_id });

        if (!post || post.length === 0) {
          return res.status(404).json({
            error: true,
            message: "post not found",
          });
        }

        return res.status(200).json({
          error: false,
          post: post[0],
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
  )

  app.put(
    "/v1/api/posts/:post_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;
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
        const post = await sdk.get({ id: post_id });

        if (!post || post.length === 0) {
          return res.status(404).json({
            error: true,
            message: "post not found",
          });
        }

        await sdk.update(
          {
            text,
            media_1,
            media_2,
            media_3,
            media_4,
            community_ids,
            mentioned_ids,
            can_reply,
          },
          post_id
        );

        return res.status(200).json({
          error: false,
          message: "post updated successfully",
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

    app.delete(
      "v1/posts/:post_id",
      [TokenMiddleware({ role: "convener" })],
      async function (req, res) {
        try {
          const { post_id } = req.params;
          const sdk = new BackendSDK();
          sdk.setTable("posts");
          const post = await sdk.get({ id: post_id });
          if (!post || post.length === 0) {
            return res.status(404).json({
              error: true,
              message: "post not found",
            });
          }
          await sdk.delete(post_id);
          return res.status(200).json({
            error: false,
            message: "post deleted successfully",
          });
        }
        catch (err) {
          console.log(err)
          res.status(500);
          res.join({
            error: true,
            message: "Something went wrong..."
          })
        }
      }
    )
  )

  // delete post
  app.delete(
    "v1/api/posts/:post_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) { 
      try {
        const { post_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { post_id: "required|integer" },
          { post_id }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const post = await sdk.get({ id: post_id });
        if (!post || post.length === 0) {
          return res.status(404).json({
            error: true,
            message: "post not found",
          });
        }
        await sdk.delete(post_id);
        return response.status(200).json({
          error: false,
          message: "post deleted successfully",
        })
      }
      catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  )

  return [];
};
