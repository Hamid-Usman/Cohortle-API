const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { COHORT_STATUSES, COHORT_LEARNER_STATUS } = require("../utils/mappings");

/**
 * @swagger
 * tags:
 *   name: Cohorts
 *   description: API endpoints for managing cohorts
 */
module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/cohorts:
   *   post:
   *     summary: Create a new cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, url]
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Cohort A"
   *               url:
   *                 type: string
   *                 example: "cohort-a"
   *               description:
   *                 type: string
   *                 example: "A sample cohort"
   *               goal:
   *                 type: string
   *                 example: "Learn Node.js"
   *               referral:
   *                 type: string
   *                 example: "friend"
   *               community_structure:
   *                 type: string
   *                 example: "flat"
   *     responses:
   *       201:
   *         description: Cohort created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 cohort_id:
   *                   type: integer
   *                 join_url:
   *                   type: string
   *                 suffix:
   *                   type: string
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  app.post(
    "/v1/api/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const {
          name,
          description,
          goal,
          url, // user-provided custom suffix
          referral,
          community_structure,
          // allow_public_join = true,
        } = req.body;

        // Validate input
        const validationResult = await ValidationService.validateObject(
          {
            name: "required|string",
            description: "string",
            goal: "string",
            url: "string",
            referral: "string",
            community_structure: "string",
          },
          {
            name,
            url,
            description,
            goal,
            referral,
            community_structure,
          },
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");

        // Normalize custom URL suffix
        let finalUrl = url.toLowerCase().trim();

        // Add random numbers to ensure uniqueness
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        finalUrl = `${finalUrl}-${randomSuffix}`;

        const cohort_id = await sdk.insert({
          name,
          url: finalUrl,
          description,
          goal,
          referral,
          community_structure,
          // allow_public_join,
          cohort_owner: req.user_id,
          status: COHORT_STATUSES.ACTIVE,
        });

        return res.status(201).json({
          error: false,
          message: "Cohort created successfully",
          cohort_id,
          join_url: `https://cohortle.com/join/${finalUrl}`, // final join link
          suffix: finalUrl,
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

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}:
   *   put:
   *     summary: Update a cohort
   *     tags: [Cohorts]
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
   *             properties:
   *               name:
   *                 type: string
   *               url:
   *                 type: string
   *               description:
   *                 type: string
   *               goal:
   *                 type: string
   *               revenue:
   *                 type: string
   *               referral:
   *                 type: string
   *               community_structure:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cohort updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Cohort not found
   *       500:
   *         description: Server error
   */
  app.put(
    "/v1/api/cohorts/:cohort_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const {
          name,
          url,
          description,
          goal,
          revenue,
          referral,
          community_structure,
        } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            name: "string",
            url: "string",
            description: "string",
            goal: "string",
            revenue: "string",
            referral: "string",
            community_structure: "string",
          },
          {
            name,
            url,
            description,
            goal,
            revenue,
            referral,
            community_structure,
            cohort_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");

        const cohort = (
          await sdk.get({ id: cohort_id, cohort_owner: req.user_id })
        )[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort does not exist",
          });
        }

        await sdk.update(
          {
            ...(name !== undefined ? { name } : {}),
            ...(url !== undefined ? { url } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(goal !== undefined ? { goal } : {}),
            ...(revenue !== undefined ? { revenue } : {}),
            ...(referral !== undefined ? { referral } : {}),
            ...(community_structure !== undefined
              ? { community_structure }
              : {}),
          },
          cohort.id,
        );

        return res.status(200).json({
          error: false,
          message: "cohort updated successfully",
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
   * /v1/api/cohorts/owner:
   *   get:
   *     summary: Get all cohorts of a convener
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of cohorts
   *       500:
   *         description: Server error
   */

  // get convener's cohorts
  app.get(
    "/v1/api/cohorts/owner",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohorts = await sdk.get({
          cohort_owner: req.user_id,
        });
        return res.status(200).json({
          error: false,
          message: "user's cohorts fetched successfully",
          cohorts,
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
   *    * @swagger
   * /v1/api/cohorts:
   *   get:
   *     summary: Get all cohorts accessible by the user
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of cohorts
   *       500:
   *         description: Server error
   */
  app.get(
    "/v1/api/cohorts",
    [UrlMiddleware, TokenMiddleware()],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohorts = await sdk.get({
          cohort_owner: req.user_id,
        });

        return res.status(200).json({
          error: false,
          message: "cohorts fetched successfully",
          cohorts,
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
   * /v1/api/cohorts/{cohort_id}:
   *   get:
   *     summary: Get a single cohort by ID
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Cohort fetched successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Cohort not found
   *       500:
   *         description: Server error
   */
  // get cohort by id
  app.get(
    "/v1/api/cohorts/:cohort_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
          },
          {
            cohort_id,
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
            message: "Cohort does not exist",
          });
        }
        return res.status(200).json({
          error: false,
          message: "cohort fetched successfully",
          cohort,
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
   * /v1/api/cohorts/{cohort_id}:
   *   delete:
   *     summary: Delete a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Cohort deleted successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  app.delete(
    "/v1/api/cohorts/:cohort_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
          },
          {
            cohort_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // Get community ids belonging to this cohort
        sdk.setTable("communities");
        const communities = await sdk.get({ cohort_id });
        const communityIds = communities.map((c) => c.id);

        if (communityIds.length > 0) {
          // Get all module ids for these communities
          sdk.setTable("community_modules");
          const modules = await sdk.rawQuery(
            `SELECT id FROM community_modules WHERE community_id IN (${communityIds.join(",")})`,
          );
          const moduleIds = modules.map((m) => m.id);

          // Delete lessons for these modules
          if (moduleIds.length > 0) {
            sdk.setTable("module_lessons");
            await sdk.rawQuery(
              `DELETE FROM module_lessons WHERE module_id IN (${moduleIds.join(",")})`,
            );
          }

          // Delete community_modules linked to these communities
          sdk.setTable("community_modules");
          await sdk.rawQuery(
            `DELETE FROM community_modules WHERE community_id IN (${communityIds.join(",")})`,
          );

          // Delete communities
          sdk.setTable("communities");
          await sdk.rawQuery(
            `DELETE FROM communities WHERE cohort_id = ${cohort_id}`,
          );
        }

        // Delete cohort members
        sdk.setTable("cohort_members");
        await sdk.deleteWhere({ cohort_id });

        // Finally, delete the cohort
        sdk.setTable("cohorts");
        await sdk.deleteWhere({ id: cohort_id, cohort_owner: req.user_id });

        return res.status(200).json({
          error: false,
          message: "cohort deleted successfully",
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
   * /v1/api/cohorts/join/{join_code}:
   *   post:
   *     summary: Join a cohort via join code
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: join_code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Joined cohort successfully
   *       400:
   *         description: User already a member
   *       404:
   *         description: Invalid join code
   *       500:
   *         description: Server error
   */
  // join cohort via join link
  app.post(
    "/v1/api/cohorts/join/:join_code",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
      try {
        const { join_code } = req.params;
        const user_id = req.user_id;

        const sdk = new BackendSDK();

        // Get cohort data
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ url: join_code }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Invalid or expired join link",
          });
        }

        // Check if already member
        sdk.setTable("cohort_members");
        const existing = await sdk.get({
          cohort_id: cohort.id,
          user_id,
        });

        if (existing.length > 0) {
          return res.status(400).json({
            error: true,
            message: "You are already a member of this cohort",
            cohort: {
              // Return cohort data even if already member
              id: cohort.id,
              name: cohort.name,
              url: cohort.url,
            },
          });
        }
        // Join cohort
        await sdk.insert({
          cohort_id: cohort.id,
          user_id,
          status: COHORT_LEARNER_STATUS.ACTIVE,
        });

        return res.json({
          error: false,
          message: "You have joined the cohort successfully",
          cohort: {
            id: cohort.id,
            name: cohort.name,
            description: cohort.description,
            url: cohort.url,
            goal: cohort.goal,
            // Include any data needed for app navigation
          },
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

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/learners:
   *   get:
   *     summary: Get all learners in a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Learners fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 learners:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       first_name:
   *                         type: string
   *                       last_name:
   *                         type: string
   *                       email:
   *                         type: string
   *                       role:
   *                         type: string
   *                       status:
   *                         type: string
   *                       member_id:
   *                         type: integer
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  // get learners in a cohort
  app.get(
    "/v1/api/cohorts/:cohort_id/learners",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
          },
          {
            cohort_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        const learners = await sdk.rawQuery(`
          SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.role, 
            cm.status,
            cm.id AS member_id 
          FROM cohort_members cm
          JOIN cohorts c ON c.id = cm.cohort_id
          JOIN users u ON u.id = cm.user_id
          WHERE cm.cohort_id = ${cohort_id}
          `);

        return res.status(200).json({
          error: false,
          message: "learners fetched successfully",
          learners,
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
   * /v1/api/cohorts/{cohort_id}/learners/{learner_id}:
   *   patch:
   *     summary: Restrict a learner in a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: learner_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Learner restricted successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Cohort not found
   *       500:
   *         description: Server error
   */
  app.patch(
    "/v1/api/cohorts/:cohort_id/learners/:learner_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, learner_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            learner_id: "required|integer",
          },
          {
            cohort_id,
            learner_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (
          await sdk.get({ id: cohort_id, cohort_owner: req.user_id })
        )[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "cohort not found",
          });
        }

        sdk.setTable("cohort_members");
        await sdk.updateWhere(
          { status: COHORT_LEARNER_STATUS.RESTRICTED },
          { id: learner_id },
        );

        return res.status(200).json({
          error: false,
          message: "learner restricted successfully",
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
   * /v1/api/cohorts/{cohort_id}/learners/{learner_id}:
   *   delete:
   *     summary: Remove a learner from a cohort
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: learner_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Learner removed successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Cohort not found
   *       500:
   *         description: Server error
   */
  app.delete(
    "/v1/api/cohorts/:cohort_id/learners/:learner_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, learner_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            learner_id: "required|integer",
          },
          {
            cohort_id,
            learner_id,
          },
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (
          await sdk.get({ id: cohort_id, cohort_owner: req.user_id })
        )[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "cohort not found",
          });
        }

        sdk.setTable("cohort_members");
        await sdk.deleteWhere({ id: learner_id });

        return res.status(200).json({
          error: false,
          message: "learner removed successfully",
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
   * /v1/api/learner/cohorts:
   *   get:
   *     summary: Get all communities the learner is part of with module counts
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of communities with module counts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 communities:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       cohort_id:
   *                         type: integer
   *                       community_owner:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       type:
   *                         type: string
   *                       description:
   *                         type: string
   *                       thumbnail:
   *                         type: string
   *                       status:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *                       module_count:
   *                         type: integer
   *       500:
   *         description: Server error
   */
  app.get(
    "/v1/api/learner/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        // component included the name of the convener
        const communities = await sdk.rawQuery(`
          SELECT comm.*, COUNT(cm.id) as module_count, u.first_name, u.last_name
          FROM communities comm
          JOIN cohorts c ON c.id = comm.cohort_id
          JOIN cohort_members cmem ON cmem.cohort_id = c.id
          LEFT JOIN community_modules cm ON cm.community_id = comm.id
          LEFT JOIN users u ON u.id = comm.community_owner
          WHERE cmem.user_id = ${req.user_id}
          GROUP BY comm.id
          `);
        return res.status(200).json({
          error: false,
          message: "learner communities fetched successfully",
          communities,
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

  // get all users except self
  app.get(
    "/v1/api/users",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        const users = await sdk.rawQuery(
          `SELECT id, first_name, last_name, email, role FROM users WHERE id != ${req.user_id}`,
        );
        return res.status(200).json({
          error: false,
          message: "users fetched successfully",
          users,
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
