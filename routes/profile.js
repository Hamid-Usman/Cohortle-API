const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const JwtService = require("../services/JwtService");
const PasswordService = require("../services/PasswordService");
const ValidationService = require("../services/ValidationService");
const { USER_STATUSES } = require("../utils/mappings");
const upload = require("../middleware/uploadMiddleware");

module.exports = function (app) {
  app.patch(
    "/v1/api/profile/set-role",
    [UrlMiddleware, TokenMiddleware({ allowNull: true })],
    async function (req, res) {
      try {
        const { role } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            role: "required|in:convener,learner",
          },
          { role }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("users");
        await sdk.update({ role }, req.user_id);

        const token = JwtService.createAccessToken(
          {
            user_id: req.user_id,
            role: role,
          },
          5 * 60 * 1000,
          process.env.JWT_SECRET
        );
        return res.status(200).json({
          error: false,
          message: "profile updated successfully",
          token,
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
    "/v1/api/profile",
    [
      upload.single("image"),
      UrlMiddleware,
      TokenMiddleware({ role: "learner|convener" }),
    ],
    async function (req, res) {
      try {
        const { 
          first_name, 
          last_name, 
          username, 
          password, 
          location, 
          socials,
        } = req.body;
        
        const imageFile = req.file;

        const validationResult = await ValidationService.validateObject(
          {
            first_name: "string",
            last_name: "string",
            username: "string",
            password: "string",
            location: "string",
            socials: "string",
          },
          { first_name, last_name, username, password, location, socials }
        );
        
        if (validationResult.error)
          return res.status(400).json(validationResult);

        let hashedPassword;
        if (password) {
          hashedPassword = await PasswordService.hash(password);
        }
        // const token = JwtService.createAccessToken(
        //   {
        //     user_id: req.user_id,
        //   },
        //   5 * 60 * 1000,
        //   process.env.JWT_SECRET
        // );

        // Build update payload
        const updateData = {
          ...(first_name && { first_name }),
          ...(last_name && { last_name }),
          ...(username && { username }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(location && { location }),
          ...(socials && { socials }),
        };

        // ✅ Save Cloudinary image URL
        if (imageFile && imageFile.path) {
          updateData.profile_image = imageFile.path;
          console.log("Cloudinary upload URL:", imageFile.path);
        }

        const sdk = new BackendSDK();
        sdk.setTable("users");
        await sdk.update(updateData, req.user_id);

        return res.status(200).json({
          error: false,
          message: {
            "FIRSTNAME": first_name,
            "LASTNAME": last_name,
            "USERNAME": username,
            "LOCATION": location,
            "SOCIALS": socials,
            "PROFILE_IMAGE": updateData.profile_image || null,
            // "TOKEN": token,
          },
        });
      } catch (err) {
        console.error('Profile update error:', err);
        
        // Clean up uploaded file if there was an error
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
          });
        }
        
        res.status(500).json({
          error: true,
          message: "Something went wrong",
        });
      }
    }
  );
  app.get(
  "/v1/api/profile",
  [UrlMiddleware, TokenMiddleware({ role: "learner|convener" })],
  async function (req, res) {
    try {
      const sdk = new BackendSDK();
      sdk.setTable("users");

      // Fetch the current user's profile using their ID from the token
      const user = (await sdk.get({ id: req.user_id }))[0];

      if (!user) {
        return res.status(404).json({
          error: true,
          message: "user not found",
        });
      }

      // Return selected safe fields
      return res.status(200).json({
        error: false,
        message: {
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          email: user.email,
          location: user.location,
          socials: user.socials,
          role: user.role,
          profile_image: user.profile_image,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      res.status(500).json({
        error: true,
        message: "something went wrong",
      });
    }
  }
  );



  app.put(
    "/v1/api/profile/set-password",
    [UrlMiddleware, TokenMiddleware({ role: "learner|convener" })],
    async function (req, res) {
      try {
        const { current_password, new_password } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            current_password: "required|string",
            new_password: "required|string",
          },
          { current_password, new_password }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        sdk.setTable("users");
        const user = (await sdk.get({ id: req.user_id }))[0];

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "user not found",
          });
        }

        const isValid = await PasswordService.compareHash(
          current_password,
          user.password
        );
        if (!isValid) {
          return res.status(401).json({
            error: true,
            message: "incorrect password",
          });
        }

        const hashedPassword = await PasswordService.hash(new_password);
        sdk.setTable("users");
        await sdk.update(
          {
            password: hashedPassword,
          },
          req.user_id
        );

        return res.status(200).json({
          error: false,
          message: "password updated successfully",
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
    "/v1/api/profile/deactivate",
    [UrlMiddleware, TokenMiddleware({ role: "learner|convener" })],
    async function (req, res) {
      try {
        const { password } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            password: "required|string",
          },
          { password }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        sdk.setTable("users");
        const user = (await sdk.get({ id: req.user_id }))[0];

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "user not found",
          });
        }

        const isValid = await PasswordService.compareHash(
          password,
          user.password
        );
        if (!isValid) {
          return res.status(401).json({
            error: true,
            message: "incorrect password",
          });
        }

        sdk.setTable("users");
        await sdk.update(
          {
            status: USER_STATUSES.INACTIVE,
          },
          req.user_id
        );

        return res.status(200).json({
          error: false,
          message: "deactivation successfully",
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
