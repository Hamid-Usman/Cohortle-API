const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const { COHORT_STATUSES, COHORT_LEARNER_STATUS } = require("../utils/mappings");

module.exports = function (app) {
  app.post( 
    "/v1/api/cohorts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const {
          name,
          url,
          description,
          goal,
          // revenue,
          referral,
          community_structure,
        } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            name: "required|string",
            url: "string",
            description: "string",
            goal: "string",
            // revenue: "string",
            referral: "string",
            community_structure: "string",
          },
          {
            name,
            url,
            description,
            goal,
            // revenue,
            referral,
            community_structure,
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort_id = await sdk.insert({
          name,
          url,
          description,
          goal,
          // revenue,
          referral,
          community_structure,
          cohort_owner: req.user_id,
          status: COHORT_STATUSES.ACTIVE,
        });

        return res.status(200).json({
          error: false,
          message: "cohort created successfully",
          cohort_id,
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
          }
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
          cohort.id
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
    }
  );

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
    }
  )


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
    }
  );

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
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);
        const sdk = new BackendSDK();
        sdk.setTable("cohorts");
        const cohort = (
          await sdk.get({ id: cohort_id })
        )[0];
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
    }
  );

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
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        
        // Delete communities first
        sdk.setTable("communities");
        await sdk.deleteWhere({ cohort_id });

        // Delete the cohort itself
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
    }
  );

  app.post(
    "/v1/api/cohorts/:cohort_id/learners",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { cohort_id } = req.params;
        const { learners } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            learners: "required|array",
            "learners.*": "required|integer",
          },
          {
            cohort_id,
            learners,
          }
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
        await Promise.all(
          learners.map((user_id) =>
            sdk.insert({
              cohort_id,
              user_id,
              status: COHORT_LEARNER_STATUS.ACTIVE,
            })
          )
        );

        return res.status(200).json({
          error: false,
          message: "learners added successfully",
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
          }
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
          message: "learners added successfully",
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
    }
  );

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
          }
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
          { id: learner_id }
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
    }
  );

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
          }
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
    }
  );

  app.get(
    "/v1/api/users",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const sdk = new BackendSDK();
        const users = await sdk.rawQuery(
          `SELECT id, first_name, last_name, email, role FROM users WHERE id != ${req.user_id}`
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
    }
  );

  return [];
};
