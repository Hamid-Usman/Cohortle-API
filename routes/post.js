const { token } = require("morgan");
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
          },
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
    },
  );

  app.get(
    "/v1/api/posts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const posts = await sdk.get();
        const userSdk = new BackendSDK();
        userSdk.setTable("users");

        const postsWithUsers = await Promise.all(
          posts.map(async (post) => {
            const [user] = await userSdk.get({ id: post.posted_by });

            const userData = user
              ? {
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                }
              : null;

            return {
              ...post,
              posted_by: userData,
            };
          }),
        );

        return res.status(200).json({
          error: false,
          message: "posts fetched successfully",
          posts: postsWithUsers,
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

  app.get(
    "/v1/posts/:post_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;
        console.log(`Fetching post with ID: ${post_id}`);

        // ✅ Validate post_id
        const validationResult = await ValidationService.validateObject(
          { post_id: "required|integer" },
          { post_id },
        );

        if (validationResult.error) {
          console.log("Validation failed:", validationResult);
          return res.status(400).json(validationResult);
        }

        // ✅ Fetch post
        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const posts = await sdk.get({ id: post_id });

        // sdk.get might return an array or a single object depending on implementation
        const post = Array.isArray(posts) ? posts[0] : posts;

        console.log("Found post:", post);

        if (!post) {
          console.log(`Post not found for ID: ${post_id}`);
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        // ✅ Fetch user details
        const userSdk = new BackendSDK();
        userSdk.setTable("users");

        const users = await userSdk.get({ id: post.posted_by });
        const user = Array.isArray(users) ? users[0] : users;

        const userData = user
          ? {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            }
          : null;

        // ✅ Prevent caching
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");

        // ✅ Final response (single post object)
        return res.status(200).json({
          error: false,
          message: "Post retrieved successfully",
          post: {
            ...post,
            posted_by: userData,
          },
        });
      } catch (err) {
        console.error("Error retrieving post:", err);
        return res.status(500).json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );

  app.post(
    "/v1/post/:post_id/comments",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;
        const { text, media_1 } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            text: "required|string",
            media_1: "url",
            post_id: "required|integer",
          },
          {
            text,
            media_1,
            post_id,
          },
        );
        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }
        const sdk = new BackendSDK();
        sdk.setTable("comments");
        const comment_id = await sdk.insert({
          text,
          media_1,
          post_id,
          commented_by: req.user_id,
        });
        return res.status(200).json({
          error: false,
          message: "comment added successfully",
          comment_id,
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
        console.log(req.body);
      }
    },
  );

  app.get(
    "/v1/post/:post_id/comments",
    [UrlMiddleware, TokenMiddleware()],
    async function (req, res) {
      try {
        const { post_id } = req.params;

        // Validate
        const validationResult = await ValidationService.validateObject(
          { post_id: "required|integer" },
          { post_id },
        );
        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        // Fetch comments
        const sdk = new BackendSDK();
        sdk.setTable("comments");
        const comments = await sdk.get({ post_id });

        // Collect user IDs
        const userIds = [...new Set(comments.map((c) => c.commented_by))];

        // Fetch users in one query
        const userSdk = new BackendSDK();
        userSdk.setTable("users");
        const users = [];
        for (const id of userIds) {
          const [user] = await userSdk.get({ id });
          if (user) users.push(user);
        }
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        // Merge users with comments
        const commentWithUser = comments.map((comment) => ({
          ...comment,
          user: userMap[comment.commented_by]
            ? {
                first_name: userMap[comment.commented_by].first_name,
                last_name: userMap[comment.commented_by].last_name,
              }
            : null,
        }));
        console.log(commentWithUser);
        return res.status(200).json({
          error: false,
          message: "Comments fetched successfully",
          comments: commentWithUser,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          error: true,
          message: "Something went wrong",
        });
      }
    },
  );

  app.delete(
    "/v1/post/:post_id/comment/:comment_id",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { post_id, comment_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            post_id: "required|integer",
            comment_id: "required|integer",
          },
          {
            post_id,
            comment_id,
          },
        );
        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }
        const sdk = new BackendSDK();
        sdk.setTable("comments");
        const deleted = await sdk.delete({ post_id }, comment_id);
        return res.status(200).json({
          error: false,
          message: "comment deleted successfully",
          deleted,
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
        console.log(req.body);
      }
    },
  );
};
