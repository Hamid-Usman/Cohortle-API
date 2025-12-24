const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { COHORT_STATUSES, MEMBER_ROLES } = require("../utils/mappings");

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/programmes/{programme_id}/cohorts:
   *   post:
   *     summary: Create a cohort in a programme
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: programme_id
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
   *             properties:
   *               name:
   *                 type: string
   *               start_date:
   *                 type: string
   *                 format: date
   *               end_date:
   *                 type: string
   *                 format: date
   *               max_members:
   *                 type: integer
   *     responses:
   *       '201':
   *         description: Cohort created successfully
   */
  app.post(
    "/v1/api/programmes/:programme_id/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { programme_id } = req.params;
        const { name, start_date, end_date, max_members } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            programme_id: "required|integer",
            name: "required|string",
            start_date: "date",
            end_date: "date",
            max_members: "integer",
          },
          { programme_id, name, start_date, end_date, max_members }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("programmes");
        const programme = (await sdk.get({ id: programme_id }))[0];

        if (!programme) {
          return res.status(404).json({
            error: true,
            message: "Programme not found",
          });
        }

        // Verify ownership
        if (programme.created_by !== req.user_id) {
          return res.status(403).json({
            error: true,
            message: "You do not have permission to create cohorts in this programme",
          });
        }

        sdk.setTable("cohorts");
        const cohort_id = await sdk.insert({
          programme_id,
          name,
          start_date,
          end_date,
          max_members,
          status: COHORT_STATUSES.ACTIVE,
        });

        return res.status(201).json({
          error: false,
          message: "Cohort created successfully",
          cohort_id,
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
   * /v1/api/programmes/{programme_id}/cohorts:
   *   get:
   *     summary: Get all cohorts in a programme
   *     tags: [Cohorts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: programme_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Cohorts fetched successfully
   */
  app.get(
    "/v1/api/programmes/:programme_id/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { programme_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { programme_id: "required|integer" },
          { programme_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohorts = await sdk.get({ programme_id });

        // Get member count for each cohort
        for (let cohort of cohorts) {
          sdk.setTable("cohort_members");
          const members = await sdk.get({ cohort_id: cohort.id });
          cohort.member_count = members.length;
        }

        return res.status(200).json({
          error: false,
          message: "Cohorts fetched successfully",
          cohorts,
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
   * /v1/api/cohorts/{cohort_id}:
   *   get:
   *     summary: Get a single cohort
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
   *       '200':
   *         description: Cohort fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        // Get member count
        sdk.setTable("cohort_members");
        const members = await sdk.get({ cohort_id });
        cohort.member_count = members.length;

        return res.status(200).json({
          error: false,
          message: "Cohort fetched successfully",
          cohort,
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
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               start_date:
   *                 type: string
   *               end_date:
   *                 type: string
   *               max_members:
   *                 type: integer
   *               status:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Cohort updated successfully
   */
  app.put(
    "/v1/api/cohorts/:cohort_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { name, start_date, end_date, max_members, status } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            name: "string",
            start_date: "date",
            end_date: "date",
            max_members: "integer",
            status: "string",
          },
          { cohort_id, name, start_date, end_date, max_members, status }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        await sdk.update(
          {
            ...(name !== undefined ? { name } : {}),
            ...(start_date !== undefined ? { start_date } : {}),
            ...(end_date !== undefined ? { end_date } : {}),
            ...(max_members !== undefined ? { max_members } : {}),
            ...(status !== undefined ? { status } : {}),
          },
          cohort_id
        );

        return res.status(200).json({
          error: false,
          message: "Cohort updated successfully",
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
   * /v1/api/cohorts/{cohort_id}/join:
   *   post:
   *     summary: Join a cohort as a learner
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
   *       '200':
   *         description: Joined cohort successfully
   */
  app.post(
    "/v1/api/cohorts/:cohort_id/join",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { user_id } = req;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Check cohort exists and is active
        sdk.setTable("cohorts");
        const cohort = (await sdk.get({ id: cohort_id }))[0];

        if (!cohort) {
          return res.status(404).json({
            error: true,
            message: "Cohort not found",
          });
        }

        if (cohort.status !== COHORT_STATUSES.ACTIVE) {
          return res.status(400).json({
            error: true,
            message: "Cohort is not active",
          });
        }

        // Check if already a member
        sdk.setTable("cohort_members");
        const existing = await sdk.get({ cohort_id, user_id });

        if (existing.length > 0) {
          return res.status(400).json({
            error: true,
            message: "You are already a member of this cohort",
          });
        }

        // Check capacity if max_members is set
        if (cohort.max_members) {
          const currentMembers = await sdk.get({ cohort_id });
          if (currentMembers.length >= cohort.max_members) {
            return res.status(400).json({
              error: true,
              message: "Cohort is full",
            });
          }
        }

        // Add member
        const member_id = await sdk.insert({
          cohort_id,
          user_id,
          role: MEMBER_ROLES.LEARNER,
          status: "active",
        });

        return res.status(200).json({
          error: false,
          message: "Joined cohort successfully",
          member_id,
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
   * /v1/api/cohorts/{cohort_id}/members:
   *   post:
   *     summary: Add a member to a cohort
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
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [learner, instructor, facilitator]
   *     responses:
   *       '201':
   *         description: Member added successfully
   */
  app.post(
    "/v1/api/cohorts/:cohort_id/members",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { email, role = MEMBER_ROLES.LEARNER } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            email: "required|email",
            role: `in:${Object.values(MEMBER_ROLES).join(",")}`,
          },
          { cohort_id, email, role }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // Find user by email
        sdk.setTable("users");
        const user = (await sdk.get({ email }))[0];

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found with this email",
          });
        }

        // Check if already a member
        sdk.setTable("cohort_members");
        const existing = await sdk.get({ cohort_id, user_id: user.id });

        if (existing.length > 0) {
          return res.status(400).json({
            error: true,
            message: "User is already a member of this cohort",
          });
        }

        // Add member
        const member_id = await sdk.insert({
          cohort_id,
          user_id: user.id,
          role,
          status: "active",
        });

        return res.status(201).json({
          error: false,
          message: "Member added successfully",
          member_id,
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
   * /v1/api/cohorts/{cohort_id}/members:
   *   get:
   *     summary: Get all members in a cohort
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
   *       '200':
   *         description: Members fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/members",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
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
            cm.enrolled_at,
            cm.id AS member_id 
          FROM cohort_members cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.cohort_id = ${cohort_id}
          ORDER BY cm.enrolled_at DESC
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
   * /v1/api/cohorts/{cohort_id}/members/{member_id}/role:
   *   patch:
   *     summary: Update a member's role
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
   *         name: member_id
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
   *               - role
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [learner, instructor, facilitator]
   *     responses:
   *       '200':
   *         description: Role updated successfully
   */
  app.patch(
    "/v1/api/cohorts/:cohort_id/members/:member_id/role",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, member_id } = req.params;
        const { role } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            member_id: "required|integer",
            role: `required|in:${Object.values(MEMBER_ROLES).join(",")}`,
          },
          { cohort_id, member_id, role }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohort_members");

        await sdk.update({ role }, member_id);

        return res.status(200).json({
          error: false,
          message: "Role updated successfully",
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
   * /v1/api/cohorts/{cohort_id}/members/{member_id}:
   *   delete:
   *     summary: Remove a member from a cohort
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
   *         name: member_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Member removed successfully
   */
  app.delete(
    "/v1/api/cohorts/:cohort_id/members/:member_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id, member_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            member_id: "required|integer",
          },
          { cohort_id, member_id }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();
        sdk.setTable("cohort_members");

        await sdk.deleteWhere({ id: member_id, cohort_id });

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

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/progress-summary:
   *   get:
   *     summary: Get aggregated progress summary for a cohort
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
   *       '200':
   *         description: Progress summary fetched successfully
   */
  app.get(
    "/v1/api/cohorts/:cohort_id/progress-summary",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          { cohort_id: "required|integer" },
          { cohort_id }
        );
        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        const sdk = new BackendSDK();

        // aggregate totals for the cohort:
        const aggSql = `
          SELECT
            COUNT(DISTINCT cm.user_id) AS member_count,
            COALESCE(SUM(pp.completed_lessons), 0) AS total_completed_lessons,
            COALESCE(ROUND(AVG(COALESCE(pp.completion_percentage, 0)),2), 0) AS average_completion_percentage
          FROM cohort_members cm
          LEFT JOIN programme_progress pp ON cm.user_id = pp.user_id AND pp.cohort_id = ${cohort_id}
          WHERE cm.cohort_id = ${cohort_id}
        `;
        const aggResult = await sdk.rawQuery(aggSql);
        const agg = (aggResult && aggResult[0]) || {
          member_count: 0,
          total_completed_lessons: 0,
          average_completion_percentage: 0,
        };

        return res.status(200).json({
          error: false,
          message: "Cohort progress summary fetched successfully",
          data: {
            member_count: Number(agg.member_count) || 0,
            total_completed_lessons: Number(agg.total_completed_lessons) || 0,
            average_completion_percentage: Number(agg.average_completion_percentage) || 0,
          },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "Internal server error" });
      }
    },
  );
// ...existing code...

  return [];
};
