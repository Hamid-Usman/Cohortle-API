const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { upload, uploadToBunny, deleteFromBunny, getPlaybackUrl } = require("../config/bunnyStream");

const {
  COMMUNITY_STATUSES,
  COMMUNITY_TYPES,
  COMMUNITY_SUB_TYPES,
  MODULE_STATUSES,
  LESSON_STATUSES,
} = require("../utils/mappings");

module.exports = function (app) {
  // create community
  /**
   * @swagger
   * /v1/api/communities:
   *   post:
   *     summary: Create a community
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - sub_type
   *             properties:
   *               name:
   *                 type: string
   *               type:
   *                 type: string
   *               description:
   *                 type: string
   *               thumbnail:
   *                 type: string
   *     responses:
   *       '201':
   *         description: Community created successfully
   *   get:
   *     summary: Get all communities
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: List of communities
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 communities:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Community'
   */



  app.post(
    "/v1/api/communities",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { type, name, description, thumbnail } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            name: "required|string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            // type: `required|in:${Object.values(COMMUNITY_SUB_TYPES).join(",")}`,
            description: "required|string",
            // thumbnail: "url",
          },
          {
            name,
            type,
            // sub_type,
            description,
            thumbnail,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();


        sdk.setTable("communities");
        const community_id = await sdk.insert({
          name,
          type: "course",
          // sub_type,
          description,
          thumbnail,
          owner_id: req.user_id,
          status: COMMUNITY_STATUSES.DRAFT,
        });

        return res.status(201).json({
          error: false,
          message: "community created successfully",
          community_id,
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

  // get communities for both users
  app.get(
    "/v1/api/communities",
    [UrlMiddleware, TokenMiddleware({ role: "learner|convener" })],
    async function (req, res) {
      try {
        const { user_id, role } = req; // now available from TokenMiddleware
        const sdk = new BackendSDK();

        let sql = "";
        if (role === "convener") {
          sql = `
            SELECT 
              c.id, c.name, c.type, c.description, c.thumbnail, c.status,
              (SELECT COUNT(*) FROM programmes p WHERE p.community_id = c.id) AS programme_count
            FROM communities c
            WHERE c.owner_id = ${user_id}
            ORDER BY c.created_at DESC
          `;
        } else {
          // Learner
          sql = `
            SELECT 
              c.id, c.name, c.type, c.description, c.thumbnail, c.status,
              (SELECT COUNT(*) FROM programmes p WHERE p.community_id = c.id) AS programme_count
            FROM communities c
            JOIN community_members cm ON c.id = cm.community_id
            WHERE cm.user_id = ${user_id}
            ORDER BY c.created_at DESC
          `;
        }

        const communities = await sdk.rawQuery(sql);

        return res.status(200).json({
          error: false,
          message: "Communities fetched successfully",
          communities,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "Something went wrong",
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/communities/{community_id}:
   *   get:
   *     summary: Get a community by ID
   *     description: Fetch a single community with its modules and lessons.
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Community fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Community'
   */
  // get community
  app.get(
    "/v1/api/communities/:community_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { community_id } = req.params;
        const { user_id, role } = req;

        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
          },
          {
            community_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // 🔹 If learner, ensure they belong to this community
        if (role === "learner") {
          sdk.setTable("community_members");
          const membership = await sdk.get({ community_id, user_id });

          if (!membership.length) {
            return res.status(403).json({
              error: true,
              message: "Access denied — you are not part of this community.",
            });
          }
        }
        sdk.setTable("communities");

        const community = (await sdk.get({ id: community_id }))[0];
        if (!community) {
          return res
            .status(404)
            .json({ error: true, message: "community not found" });
        }

        sdk.setTable("programmes");
        const programmes = await sdk.get({ community_id });
        community.programmes = programmes;

        return res.status(200).json({
          error: false,
          message: "community fetched successfully",
          community,
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

  /**
   * @swagger
   * /v1/api/communities/{community_id}:
   *   put:
   *     summary: Edit a community
   *     description: Update a community's data. Only the community owner can edit.
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
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
   *               type:
   *                 type: string
   *               sub_type:
   *                 type: string
   *               description:
   *                 type: string
   *               status:
   *                 type: string
   *               thumbnail:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Community updated successfully
   */
  // edit community
  app.put(
    "/v1/api/communities/:community_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { community_id } = req.params;
        const { type, name, description, status, thumbnail } =
          req.body;

        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
            name: "string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            // sub_type: `in:${Object.values(COMMUNITY_SUB_TYPES).join(",")}`,
            description: "string",
            status: `in:${Object.values(COMMUNITY_STATUSES).join(",")}`,
            thumbnail: "url",
          },
          {
            community_id,
            name,
            type,
            // sub_type,
            description,
            status,
            thumbnail,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("communities");

        const community = (
          await sdk.get({
            owner_id: req.user_id,
            id: community_id,
          })
        )[0];

        if (!community) {
          return res.status(404).json({
            error: true,
            message: "community not found",
          });
        }

        await sdk.update(
          {
            ...(name !== undefined ? { name } : {}),
            ...(type !== undefined ? { type } : {}),
            ...(sub_type !== undefined ? { sub_type } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(thumbnail !== undefined ? { thumbnail } : {}),
          },
          community_id,
        );

        return res.status(200).json({
          error: false,
          message: "community updated successfully",
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

  /**
   * @swagger
   * /v1/api/communities/{community_id}:
   *   delete:
   *     summary: Delete a community
   *     description: Delete a community. Only the owner (convener) can delete.
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Community deleted successfully
   */
  // delete community
  app.delete(
    "/v1/api/communities/:community_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { community_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
          },
          {
            community_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // First, get all modules for this community
        sdk.setTable("community_modules");
        const modules = await sdk.get({ community_id });

        // Delete all lessons for each module
        if (modules.length > 0) {
          const moduleIds = modules.map((m) => m.id);
          sdk.setTable("module_lessons");
          await sdk.rawQuery(
            `DELETE FROM module_lessons WHERE module_id IN (${moduleIds.join(",")})`,
          );
        }

        // Delete all modules for this community
        sdk.setTable("community_modules");
        await sdk.deleteWhere({ community_id });

        // Finally, delete the community
        sdk.setTable("communities");
        await sdk.deleteWhere({
          id: community_id,
          owner_id: req.user_id,
        });

        return res.status(200).json({
          error: false,
          message: "community deleted successfully",
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