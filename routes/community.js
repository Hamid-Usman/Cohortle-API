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
   * /v1/api/cohorts/{cohort_id}/communities:
   *   post:
   *     summary: Create a community
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
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
   *               sub_type:
   *                 type: string
   *               description:
   *                 type: string
   *               thumbnail:
   *                 type: string
   *     responses:
   *       '201':
   *         description: Community created successfully
   *   get:
   *     summary: Get all communities for a cohort
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
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

  /**
   * @swagger
   * /v1/api/communities/{community_id}/modules:
   *   post:
   *     summary: Create a module in a community
   *     description: Only conveners can create modules. Returns the ID of the created module.
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the community
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - order_number
   *             properties:
   *               title:
   *                 type: string
   *                 description: Title of the module
   *               order_number:
   *                 type: integer
   *                 description: Module order in the community
   *     responses:
   *       '201':
   *         description: Module created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 module_id:
   *                   type: integer
   *                 message:
   *                   type: string
   */

  /**
   * @swagger
   * /v1/api/communities/{community_id}/modules:
   *   get:
   *     summary: Get all modules for a community
   *     description: Fetches all modules in a given community.
   *     tags: [Modules]
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
   *         description: Modules fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 modules:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Module'
   */

  /**
   * @swagger
   * /v1/api/communities/{community_id}/modules/{module_id}:
   *   get:
   *     summary: Get a module by ID
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Module fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Module'
   */

  /**
   * @swagger
   * /v1/api/communities/{community_id}/modules/{module_id}:
   *   put:
   *     summary: Update a module
   *     description: Only the module owner can update module details.
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: module_id
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
   *               title:
   *                 type: string
   *               order_number:
   *                 type: integer
   *               status:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Module updated successfully
   */

  /**
   * @swagger
   * /v1/api/communities/{community_id}/modules/{module_id}:
   *   delete:
   *     summary: Delete a module
   *     description: Only the module owner can delete a module.
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: community_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Module deleted successfully
   */

  // LEARNER

  /**
   * @swagger
   * /v1/api/modules/{module_id}/lessons:
   *   post:
   *     summary: Create a lesson in a module
   *     description: Only conveners can create lessons. Media upload is optional.
   *     tags: [Lessons]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - order_number
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               order_number:
   *                 type: integer
   *               media:
   *                 type: string
   *                 format: binary
   *                 description: Optional lesson media file
   *     responses:
   *       '201':
   *         description: Lesson created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 lesson_id:
   *                   type: integer
   *                 media_url:
   *                   type: string
   *                 message:
   *                   type: string
   */

  /**
   * @swagger
   * /v1/api/modules/{module_id}/lessons:
   *   get:
   *     summary: Get all lessons in a module
   *     tags: [Lessons]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Lessons fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 lessons:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Lesson'
   */

  /**
   * @swagger
   * /v1/api/modules/{module_id}/lessons/{lesson_id}:
   *   get:
   *     summary: Get a lesson by ID
   *     tags: [Lessons]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: lesson_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Lesson fetched successfully
   */

  /**
   * @swagger
   * /v1/api/modules/{module_id}/lessons/{lesson_id}:
   *   put:
   *     summary: Update a lesson
   *     description: Update lesson details. Media upload is optional.
   *     tags: [Lessons]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: lesson_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               order_number:
   *                 type: integer
   *               status:
   *                 type: string
   *               text:
   *                 type: string
   *               media:
   *                 type: string
   *                 format: binary
   *                 description: Optional lesson media file
   *     responses:
   *       '200':
   *         description: Lesson updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 media_url:
   *                   type: string
   *                 message:
   *                   type: string
   */

  /**
   * @swagger
   * /v1/api/modules/{module_id}/lessons/{lesson_id}:
   *   delete:
   *     summary: Delete a lesson
   *     description: Only the lesson owner can delete the lesson.
   *     tags: [Lessons]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: module_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *       - name: lesson_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Lesson deleted successfully
   */

  app.post(
    "/v1/api/cohorts/:cohort_id/communities",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { type, sub_type, name, description, thumbnail } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            name: "required|string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            sub_type: `required|in:${Object.values(COMMUNITY_SUB_TYPES).join(",")}`,
            description: "required|string",
            // thumbnail: "url",
          },
          {
            cohort_id,
            name,
            type,
            sub_type,
            description,
            thumbnail,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "cohort not found",
          });
        }

        sdk.setTable("communities");
        const community_id = await sdk.insert({
          cohort_id,
          name,
          type: "course",
          sub_type,
          description,
          thumbnail,
          community_owner: req.user_id,
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
    "/v1/api/cohorts/:cohort_id/communities",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { user_id, role } = req; // now available from TokenMiddleware

        // 🔹 Validate input
        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id },
        );
        if (validationResult.error)
          return res.status(400).json({
            error: true,
            message: "Invalid request data",
            details: validationResult,
          });

        const sdk = new BackendSDK();

        // 🔹 If learner, check they belong to this cohort
        if (role === "learner") {
          sdk.setTable("cohort_learners");
          const membership = await sdk.get({
            cohort_id,
            learner_id: user_id,
          });

          if (!membership.length) {
            return res.status(403).json({
              error: true,
              message: "Access denied — you are not part of this cohort.",
            });
          }
        }

        // 🔹 Fetch communities
        const communities = await sdk.rawQuery(`
          SELECT 
            c.cohort_id,
            c.id, 
            c.name, 
            c.type,
            c.description,
            COUNT(cm.id) AS modules
          FROM 
            communities c
          LEFT JOIN 
            community_modules cm ON cm.community_id = c.id
          WHERE 
            c.cohort_id = ${cohort_id}
          GROUP BY 
            c.cohort_id,
            c.id, 
            c.name,
            c.type,
            c.description;
        `);

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
   * /v1/api/cohorts/{cohort_id}/communities/{community_id}:
   *   get:
   *     summary: Get a community by ID
   *     description: Fetch a single community with its modules and lessons.
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: cohort_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
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
    "/v1/api/cohorts/:cohort_id/communities/:community_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { cohort_id, community_id } = req.params;
        const { user_id, role } = req;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            community_id: "required|integer",
          },
          {
            cohort_id,
            community_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // 🔹 If learner, ensure they belong to this cohort
        if (role === "learner") {
          sdk.setTable("cohort_learners");
          const membership = await sdk.get({ cohort_id, learner_id: user_id });

          if (!membership.length) {
            return res.status(403).json({
              error: true,
              message: "Access denied — you are not part of this cohort.",
            });
          }
        }
        sdk.setTable("communities");

        const community = (await sdk.get({ cohort_id, id: community_id }))[0];
        if (!community) {
          return res
            .status(404)
            .json({ error: true, message: "community not found" });
        }

        sdk.setTable("community_modules");
        let modules = await sdk.get({ community_id });

        let lessons = [];
        if (modules.length > 0) {
          lessons = await sdk.rawQuery(
            `SELECT * FROM module_lessons WHERE module_id IN (${modules.map((m) => m.id).join(",")})`,
          );

          modules = modules.map((m) => {
            const moduleLessons = lessons.filter((l) => l.module_id === m.id);
            return { ...m, lessons: moduleLessons };
          });
        }

        community.modules = modules;

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
   * /v1/api/cohorts/{cohort_id}/communities/{community_id}:
   *   put:
   *     summary: Edit a community
   *     description: Update a community's data. Only the community owner can edit.
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: cohort_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
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
    "/v1/api/cohorts/:cohort_id/communities/:community_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, community_id } = req.params;
        const { type, sub_type, name, description, status, thumbnail } =
          req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            community_id: "required|integer",
            name: "string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            sub_type: `in:${Object.values(COMMUNITY_SUB_TYPES).join(",")}`,
            description: "string",
            status: `in:${Object.values(COMMUNITY_STATUSES).join(",")}`,
            thumbnail: "url",
          },
          {
            cohort_id,
            community_id,
            name,
            type,
            sub_type,
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
            cohort_id: cohort_id,
            community_owner: req.user_id,
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
   * /v1/api/cohorts/{cohort_id}/communities/{community_id}:
   *   delete:
   *     summary: Delete a community
   *     description: Delete a community. Only the owner (convener) can delete.
   *     tags: [Communities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: cohort_id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
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
    "/v1/api/cohorts/:cohort_id/communities/:community_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, community_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            community_id: "required|integer",
          },
          {
            cohort_id,
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
          cohort_id: cohort_id,
          community_owner: req.user_id,
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

  // create module
  app.post(
    "/v1/api/communities/:community_id/modules",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { community_id } = req.params;
        const { title, order_number } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
            title: "required|string",
            order_number: "required|integer",
          },
          {
            community_id,
            title,
            order_number,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        sdk.setTable("community_modules");
        const module_id = await sdk.insert({
          community_id,
          title,
          order_number,
          status: MODULE_STATUSES.DRAFT,
        });

        return res.status(201).json({
          error: false,
          message: "module created successfully",
          module_id,
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

  // Get modules for a community
  app.get(
    "/v1/api/communities/:community_id/modules",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { community_id } = req.params;

        // Validate input
        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
          },
          {
            community_id,
          },
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        // First verify the community exists
        const sdk = new BackendSDK();
        sdk.setTable("communities");
        const communityExists = await sdk.get({ id: community_id });

        if (!communityExists || communityExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Community not found",
          });
        }

        // Get modules
        const moduleSDK = new BackendSDK();
        moduleSDK.setTable("community_modules");
        const modules = await moduleSDK.get({ community_id });

        return res.status(200).json({
          error: false,
          message: "Modules fetched successfully",
          modules: modules || [], // Return empty array if no modules
        });
      } catch (err) {
        console.error("Error fetching modules:", err);
        res.status(500).json({
          error: true,
          message: "Failed to fetch modules",
          details:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    },
  );

  // get module
  app.get(
    "/v1/api/communities/:community_id/modules/:module_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { community_id, module_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
            module_id: "required|integer",
          },
          {
            community_id,
            module_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("community_modules");
        const module = (await sdk.get({ id: module_id, community_id }))[0];
        if (!module) {
          return res.status(404).json({
            error: true,
            message: "module not found",
          });
        }
        return res.status(200).json({
          error: false,
          message: "module fetched successfully",
          module,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    },
  );

  // edit module
  app.put(
    "/v1/api/communities/:community_id/modules/:module_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id, community_id } = req.params;
        const { title, status, order_number } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
            community_id: "required|integer",
            title: "string",
            status: `in:${Object.values(MODULE_STATUSES).join(",")}`,
            order_number: "integer",
          },
          {
            module_id,
            community_id,
            title,
            status,
            order_number,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("community_modules");

        await sdk.updateWhere(
          {
            ...(title !== undefined ? { title } : {}),
            ...(order_number !== undefined ? { order_number } : {}),
            ...(status !== undefined ? { status } : {}),
          },
          { id: module_id, community_id },
        );

        return res.status(200).json({
          error: false,
          message: "module updated successfully",
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

  // delete module
  app.delete(
    "/v1/api/communities/:community_id/modules/:module_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id, community_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
            community_id: "required|integer",
          },
          {
            module_id,
            community_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // First delete lessons related to the module to avoid FK constraint errors
        sdk.setTable("module_lessons");
        await sdk.deleteWhere({ module_id: module_id });

        // Then delete the module
        sdk.setTable("community_modules");
        await sdk.deleteWhere({
          id: module_id,
          community_id: community_id,
        });

        return res.status(200).json({
          error: false,
          message: "module deleted successfully",
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

  app.post(
    "/v1/api/modules/:module_id/lessons",
    [
      UrlMiddleware,
      TokenMiddleware({ role: "convener" }),
      upload.single("media"),
    ],
    async (req, res) => {
      try {
        const { module_id } = req.params;
        const { name, description, order_number } = req.body;

        let bunnyGuid = null;

        if (req.file) {
          const result = await uploadToBunny(req.file.buffer, {
            title: name || req.file.originalname,
          });
          bunnyGuid = result.videoId; // This is the GUID
        }

        const sdk = new BackendSDK();
        sdk.setTable("module_lessons");

        const lesson_id = await sdk.insert({
          module_id,
          name,
          description: description || null,
          media: bunnyGuid,           // Store ONLY the GUID in `media`
          order_number,
          status: LESSON_STATUSES.DRAFT,
        });

        return res.status(201).json({
          error: false,
          message: "Lesson created successfully",
          lesson_id,
          media_url: getPlaybackUrl(bunnyGuid),  // Return full URL to frontend
        });
      } catch (err) {
        console.error("Lesson create error:", err);
        return res.status(500).json({ error: true, message: "Upload failed" });
      }
    }
  );

  // get lessons
  app.get(
    "/v1/api/modules/:module_id/lessons",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { module_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
          },
          {
            module_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("module_lessons");

        const lessons = await sdk.get({ module_id });

        return res.status(200).json({
          error: false,
          message: "lessons fetched successfully",
          lessons,
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

  // get lesson
  app.get(
    "/v1/api/modules/:module_id/lessons/:lesson_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id, lesson_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
            lesson_id: "required|integer",
          },
          {
            module_id,
            lesson_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("module_lessons");

        const lesson = (await sdk.get({ id: lesson_id, module_id }))[0];
        if (!lesson) {
          return res.status(404).json({
            error: true,
            message: "lesson not found",
          });
        }

        return res.status(200).json({
          error: false,
          message: "lesson fetched successfully",
          lesson,
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

  // UPDATE LESSON
app.put(
  "/v1/api/modules/:module_id/lessons/:lesson_id",
  [UrlMiddleware, TokenMiddleware({ role: "convener" }), upload.single("media")],
  async function (req, res) {
    try {
      const { module_id, lesson_id } = req.params;
      const { name, description, status, order_number, text } = req.body;

      const sdk = new BackendSDK();
      sdk.setTable("module_lessons");
      const lesson = (await sdk.get({ id: lesson_id, module_id }))[0];
      if (!lesson) return res.status(404).json({ error: true, message: "Lesson not found" });

      let currentGuid = lesson.media; // Start with existing

      if (req.file) {
        // Only run upload logic if a new file was sent
        if (currentGuid) await deleteFromBunny(currentGuid);

        const result = await uploadToBunny(req.file.buffer, {
          title: name || lesson.name,
        });
        currentGuid = result.videoId;
      }

      // Save to DB (only if something changed)
      await sdk.updateWhere(
        {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(order_number !== undefined ? { order_number } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(text !== undefined ? { text } : {}),
          ...(currentGuid !== lesson.media ? { media: currentGuid } : {}),
        },
        { id: lesson_id, module_id }
      );

      // THIS IS THE FIX: Always return the final value
      return res.status(200).json({
        error: false,
        message: "Lesson updated successfully",
        media_url: getPlaybackUrl(currentGuid),  // ← Now always correct
      });
    } catch (err) {
      console.error("Lesson update error:", err);
      return res.status(500).json({ error: true, message: "Update failed" });
    }
  }
);

  // delete lesson
  app.delete(
    "/v1/api/modules/:module_id/lessons/:lesson_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id, lesson_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
            lesson_id: "required|integer",
          },
          {
            module_id,
            lesson_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // First, fetch the lesson to get the media URL
        sdk.setTable("module_lessons");
        const lesson = (await sdk.get({ id: lesson_id, module_id }))[0];

        if (!lesson) {
          return res.status(404).json({
            error: true,
            message: "lesson not found",
          });
        }

        // If the lesson has media, delete it from Cloudinary
        if (lesson.media) {
          try {
            const publicId = extractPublicId(lesson.media);
            if (publicId) {
              await deleteFromCloudinary(publicId);
            }
          } catch (cloudinaryError) {
            console.error("Error deleting media from Cloudinary:", cloudinaryError);
            // Continue with lesson deletion even if Cloudinary delete fails
          }
        }

        // Delete the lesson from the database
        await sdk.deleteWhere({
          id: lesson_id,
          module_id: module_id,
        });

        return res.status(200).json({
          error: false,
          message: "lesson deleted successfully",
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