const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const JwtService = require("../services/JwtService");
const PasswordService = require("../services/PasswordService");
const ValidationService = require("../services/ValidationService");
const { USER_STATUSES } = require("../utils/mappings");
const multer = require('multer');
const upload = multer();
module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/profile/set-role:
   *   patch:
   *     summary: Set user role after registration
   *     description: Allows a newly registered user to set their role (either learner or convener). Generates a short-lived access token.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
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
   *                 enum: [learner, convener]
   *                 example: learner
   *     responses:
   *       200:
   *         description: Role set successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
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
          { role },
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
          process.env.JWT_SECRET,
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
    },
  );

  /**
   * @swagger
   * /v1/api/profile:
   *   put:
   *     summary: Update user profile
   *     description: Allows a user to update their profile details including name, username, password, and profile image.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               first_name:
   *                 type: string
   *                 example: John
   *               last_name:
   *                 type: string
   *                 example: Doe
   *               username:
   *                 type: string
   *                 example: johndoe123
   *               password:
   *                 type: string
   *                 example: newpassword123
   *               location:
   *                 type: string
   *                 example: Lagos, Nigeria
   *               socials:
   *                 type: string
   *                 example: "@johndoe"
   *               image:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  app.put(
    "/v1/api/profile",
    [
      upload.single("image"),
      UrlMiddleware,
      TokenMiddleware({ role: "learner|convener" }),
    ],
    async (req, res) => {
      try {
        const { first_name, last_name, username, password, location, socials, bio } =
          req.body;

        let profileImageUrl;
        // if (req.file) {
        //   profileImagerl = await uploadToCloudinary(
        //     req.file.buffer,
        //     "profiles",
        //   );
        //   console.log("Cloudinary upload URL:", profileImageUrl);
        // }

        const validationResult = await ValidationService.validateObject(
          {
            first_name: "string",
            last_name: "string",
            username: "string",
            password: "string",
            location: "string",
            socials: "string",
            bio: "string"
          },
          { first_name, last_name, username, password, location, socials, bio },
        );

        if (validationResult.error)
          return res.status(400).json(validationResult);

        let hashedPassword;
        if (password) hashedPassword = await PasswordService.hash(password);

        const updateData = {
          ...(first_name && { first_name }),
          ...(last_name && { last_name }),
          ...(username && { username }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(location && { location }),
          ...(socials && { socials }),
          ...(bio && { bio }),
          // ...(profileImageUrl && { profile_image: profileImageUrl }),
        };

        const sdk = new BackendSDK();
        sdk.setTable("users");
        await sdk.update(updateData, req.user_id);

        return res.status(200).json({
          error: false,
          message: {
            FIRSTNAME: first_name,
            LASTNAME: last_name,
            USERNAME: username,
            LOCATION: location,
            SOCIALS: socials,
            BIO: bio,
            PROFILE_IMAGE: profileImageUrl || null,
          },
        });
      } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ error: true, message: "Something went wrong" });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/profile:
   *   get:
   *     summary: Get user profile
   *     description: Fetches the currently authenticated user's profile information.
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
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
            bio: user.bio
          },
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({
          error: true,
          message: "something went wrong",
        });
      }
    },
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
          { current_password, new_password },
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
          user.password,
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
          req.user_id,
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
    },
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
          { password },
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
          user.password,
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
          req.user_id,
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
    },
  );

  return [];
};
