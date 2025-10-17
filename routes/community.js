const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const {
  COMMUNITY_STATUSES,
  COMMUNITY_TYPES,
  COMMUNITY_SUB_TYPES,
  MODULE_STATUSES,
  LESSON_STATUSES,
} = require("../utils/mappings");

module.exports = function (app) {
  // create community
  app.post(
    "/v1/api/cohorts/:cohort_id/communities",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {        const { cohort_id } = req.params;
        const { type, sub_type, name, description, thumbnail } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            cohort_id: "required|integer",
            name: "required|string",
            type: `in:${COMMUNITY_TYPES.join(",")}`,
            sub_type: `required|in:${Object.values(COMMUNITY_SUB_TYPES).join(",")}`,
            description: "required|string",
            thumbnail: "url",
          },
          {
            cohort_id,
            name,
            type,
            sub_type,
            description,
            thumbnail,
          }
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
          type,
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
    }
  );

  // get communities
  app.get(
    "/v1/api/cohorts/:cohort_id/communities",
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
          message: "communities successfully",
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
    }
  );

  // get community
  app.get(
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
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
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
            `SELECT * FROM module_lessons WHERE module_id IN (${modules.map((m) => m.id).join(",")})`
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
    }
  );

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
          }
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
          community_id
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
    }
  );

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
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

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
    }
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
          }
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
    }
  );
  
  // Get modules for a community
  app.get(
    "/v1/api/communities/:community_id/modules",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
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
          }
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
            message: "Community not found" 
          });
        }

        // Get modules
        const moduleSDK = new BackendSDK();
        moduleSDK.setTable("community_modules");
        const modules = await moduleSDK.get({ community_id });

        return res.status(200).json({
          error: false,
          message: "Modules fetched successfully",
          modules: modules || [] // Return empty array if no modules
        });
      }
      catch (err) {
        console.error("Error fetching modules:", err);
        res.status(500).json({
          error: true,
          message: "Failed to fetch modules",
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    }
  );

  // get module
  app.get("/v1/api/communities/:community_id/modules/:module_id",
    [UrlMiddleware, TokenMiddleware({"role": "convener"})],
    async function (req, res) {
      try {
        const { community_id, module_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            community_id: "required|integer",
            module_id: "required|integer"
          },
          {
            community_id,
            module_id
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult)
        
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
        module
      });
    }
      catch (err) {
        console.error(err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    }
  )


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
          }
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
          { id: module_id, community_id }
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
    }
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
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

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
    }
  );

  // create lesson
  app.post(
    "/v1/api/modules/:module_id/lessons",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id } = req.params;
        const { name, description, media, order_number } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
            name: "required|string",
            description: "string",
            media: "url",
            order_number: "required|integer",
          },
          {
            module_id,
            name,
            description,
            media,
            order_number,
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        sdk.setTable("module_lessons");
        const lesson_id = await sdk.insert({
          module_id,
          name,
          description,
          media,
          order_number,
          status: LESSON_STATUSES.DRAFT,
        });

        return res.status(201).json({
          error: false,
          message: "lesson created successfully",
          lesson_id,
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

  // get lessons
  app.get(
    "/v1/api/modules/:module_id/lessons",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id } = req.params;

        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
          },
          {
            module_id,
          }
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
    }
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
          }
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
    }
  );
  
  // edit lesson
  app.put(
    "/v1/api/modules/:module_id/lessons/:lesson_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { module_id, lesson_id } = req.params;
        const { name, description, media, status, order_number } = req.body;

        const validationResult = await ValidationService.validateObject(
          {
            module_id: "required|integer",
            lesson_id: "required|integer",
            name: "string",
            description: "string",
            media: "url",
            status: `in:${Object.values(LESSON_STATUSES).join(",")}`,
            order_number: "integer",
          },
          {
            module_id,
            lesson_id,
            name,
            description,
            media,
            status,
            order_number,
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("module_lessons");

        await sdk.updateWhere(
          {
            ...(name !== undefined ? { name } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(media !== undefined ? { media } : {}),
            ...(order_number !== undefined ? { order_number } : {}),
            ...(status !== undefined ? { status } : {}),
          },
          { id: lesson_id, module_id }
        );

        return res.status(200).json({
          error: false,
          message: "lesson updated successfully",
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
          }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        sdk.setTable("module_lessons");
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
    }
  );

  return [];
};
