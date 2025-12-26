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
        let { type, name, description, goals, referral, codePrefix = "", thumbnail } = req.body;
        if (!type || type === '') type = COMMUNITY_TYPES[0]; // Default to first type if empty/null/undefined

        const validationResult = await ValidationService.validateObject(
          {
            name: "required|string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            description: "required|string",
            goals: "string",
            referral: "string",
            // thumbnail: "url",
          },
          {
            name,
            type,
            codePrefix,
            description,
            goals,
            referral,
            thumbnail,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // Generate unique code (8 chars alphanumeric)
        const generated_code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const unique_code = codePrefix + generated_code;

        sdk.setTable("communities");
        const community_id = await sdk.insert({
          name,
          type,
          // sub_type,
          description,
          goals,
          referral,
          thumbnail,
          unique_code,
          owner_id: req.user_id,
          status: COMMUNITY_STATUSES.DRAFT,
        });

        return res.status(201).json({
          error: false,
          message: "community created successfully",
          community_id,
          unique_code,
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
            SELECT DISTINCT
              c.id, c.name, c.type, c.description, c.thumbnail, c.status, c.unique_code,
              (SELECT COUNT(*) FROM programmes p WHERE p.community_id = c.id) AS programme_count
            FROM communities c
            LEFT JOIN community_members cm ON c.id = cm.community_id
            WHERE c.owner_id = ${user_id} OR cm.user_id = ${user_id}
            ORDER BY c.created_at DESC
          `;
        } else {
          // Learner
          sql = `
            SELECT 
              c.id, c.name, c.type, c.description, c.thumbnail, c.status, c.unique_code,
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
   * /v1/api/communities/join:
   *   post:
   *     summary: Join a community via unique code
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
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Joined community successfully
   */
  app.post(
    "/v1/api/communities/join",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
      try {
        const { code } = req.body;
        const { user_id } = req;

        const validationResult = await ValidationService.validateObject(
          { code: "required|string" },
          { code }
        );
        if (validationResult.error) return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // Find community by code
        const community = await sdk.rawQuery(`SELECT * FROM communities WHERE unique_code = '${code}' LIMIT 1`);

        if (community.length === 0) {
          return res.status(404).json({ error: true, message: "Invalid community code" });
        }

        const community_id = community[0].id;

        // Check if already member
        sdk.setTable("community_members");
        const existing = await sdk.get({ community_id, user_id });

        if (existing.length > 0) {
          return res.status(400).json({ error: true, message: "You are already a member of this community" });
        }

        // Add member
        await sdk.insert({
          community_id,
          user_id,
          role: "learner",
          status: "active"
        });

        return res.status(200).json({
          error: false,
          message: "Joined community successfully",
          community_id
        });

      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "Something went wrong" });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/communities/joined:
   *   get:
   *     summary: Get communities the logged-in user has joined
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Communities fetched successfully
   */
  app.get(
    "/v1/api/communities/joined",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { user_id } = req;
        const sdk = new BackendSDK();

        const sql = `
            SELECT 
              c.id, c.name, c.type, c.description, c.thumbnail, c.status, c.unique_code,
              cm.role as member_role,
              cm.created_at as joined_at,
              (SELECT COUNT(*) FROM programmes p WHERE p.community_id = c.id) AS programme_count
            FROM communities c
            JOIN community_members cm ON c.id = cm.community_id
            WHERE cm.user_id = ${user_id}
            ORDER BY cm.created_at DESC
        `;

        const communities = await sdk.rawQuery(sql);

        return res.status(200).json({
          error: false,
          message: "Joined communities fetched successfully",
          communities,
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
        const { type, name, description, goals, referral, status, thumbnail } =
          req.body;

        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
            name: "string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            // sub_type: `in:${Object.values(COMMUNITY_SUB_TYPES).join(",")}`,
            description: "string",
            goals: "string",
            referral: "string",
            status: `in:${Object.values(COMMUNITY_STATUSES).join(",")}`,
            thumbnail: "url",
          },
          {
            community_id,
            name,
            type,
            // sub_type,
            description,
            goals,
            referral,
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
            ...(description !== undefined ? { description } : {}),
            ...(goals !== undefined ? { goals } : {}),
            ...(referral !== undefined ? { referral } : {}),
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

        // 1. Get all programmes for this community
        sdk.setTable("programmes");
        const programmes = await sdk.get({ community_id });

        if (programmes.length > 0) {
          const programmeIds = programmes.map((p) => p.id);

          // 2. Get all modules for these programmes
          sdk.setTable("programme_modules");
          const modules = await sdk.rawQuery(
            `SELECT * FROM programme_modules WHERE programme_id IN (${programmeIds.join(",")})`
          );

          if (modules.length > 0) {
            const moduleIds = modules.map((m) => m.id);

            // 3. Delete all lessons for these modules
            sdk.setTable("module_lessons");
            await sdk.rawQuery(
              `DELETE FROM module_lessons WHERE module_id IN (${moduleIds.join(",")})`
            );

            // 4. Delete all modules
            sdk.setTable("programme_modules");
            await sdk.rawQuery(
              `DELETE FROM programme_modules WHERE programme_id IN (${programmeIds.join(",")})`
            );
          }

          // 5. Delete all programmes
          sdk.setTable("programmes");
          await sdk.rawQuery(
            `DELETE FROM programmes WHERE id IN (${programmeIds.join(",")})`
          );
        }

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

  /**
   * @swagger
   * /v1/api/communities/{community_id}/members:
   *   get:
   *     summary: Get all members of a community
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
   *         description: Members fetched successfully
   */
  app.get(
    "/v1/api/communities/:community_id/members",
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
        const members = await sdk.rawQuery(`
          SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.profile_image,
            cm.role,
            cm.status,
            cm.created_at AS joined_at,
            cm.id AS membership_id 
          FROM community_members cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.community_id = ${community_id}
          ORDER BY cm.created_at DESC
        `);

        return res.status(200).json({
          error: false,
          message: "Members fetched successfully",
          members,
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
   * /v1/api/communities/{community_id}/members/{user_id}:
   *   delete:
   *     summary: Remove a member from a community
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: user_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Member removed successfully
   */
  app.delete(
    "/v1/api/communities/:community_id/members/:user_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { community_id, user_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
            user_id: "required|integer",
          },
          { community_id, user_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Verify ownership
        sdk.setTable("communities");
        const community = (await sdk.get({ id: community_id }))[0];

        if (!community) {
          return res.status(404).json({
            error: true,
            message: "Community not found",
          });
        }

        if (community.owner_id !== req.user_id) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to remove members from this community",
          });
        }

        sdk.setTable("community_members");
        await sdk.deleteWhere({ community_id, user_id });

        return res.status(200).json({
          error: false,
          message: "Member removed successfully",
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