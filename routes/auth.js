const BackendSDK = require("../core/BackendSDK");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const JwtService = require("../services/JwtService");
const MailService = require("../services/MailService");
const PasswordService = require("../services/PasswordService");
const ValidationService = require("../services/ValidationService");
const { USER_STATUSES } = require("../utils/mappings");
const { UniqueConstraintError } = require("sequelize");

module.exports = function (app) {
  app.post(
    "/v1/api/auth/register-email",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { email } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            email: "required|email",
          },
          { email }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();

        // create user
        sdk.setTable("users");
        const newUserId = await sdk.insert({
          email,
          status: USER_STATUSES.INACTIVE,
        });

        // create preference
        sdk.setTable("preferences");
        await sdk.insert({
          email_updates: 1,
          new_posts: 1,
          new_course_content: 1,
          new_polls: 1,
          mentions: 0,
          replies_on_post: 0,
          user_id: newUserId,
        });

        // create verification link
        const token = JwtService.createAccessToken(
          {
            user_id: newUserId,
          },
          50 * 10000 * 600,
          process.env.JWT_SECRET
        );

        const link = `${process.env.FRONTEND_URL}/auth/verify-email?t=${token}`;
        console.log("verification link", link);

        const config = {
          mail_host: process.env.MAIL_HOST,
          mail_port: process.env.MAIL_PORT,
          mail_user: process.env.MAIL_USER,
          mail_pass: process.env.MAIL_PASS,
        };
        MailService.initialize(config);

        await MailService.send({
          from: process.env.MAIL_FROM,
          to: email,
          html: MailService.VERIFICATION_EMAIL.replace("{{{link}}}", link),
          subject: "Confirm your email to get started with Cohortly",
        });

        return res.status(200).json({
          error: false,
          message: "Email sent successfully",
          link,
        });
      } catch (err) {
        // handle duplicate email
        if (
          err instanceof UniqueConstraintError &&
          err.errors[0].path === "email"
        ) {
          return res.status(400).json({
            error: true,
            message: "Email already in use",
          });
        }

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
    "/v1/api/auth/verify-email",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { verify_token } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            verify_token: "required|string",
          },
          { verify_token }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const payload = JwtService.verifyAccessToken(
          verify_token,
          process.env.JWT_SECRET
        );

        if (!payload) {
          return res.status(401).json({
            error: true,
            message: "Invalid token or token expired",
          });
        }

        const sdk = new BackendSDK();

        sdk.setTable("users");
        const user = (await sdk.get({ id: payload.user_id }))[0];
        if (!user) {
          return res.status(404).json({
            error: true,
            message: "user not found",
          });
        }

        await sdk.update({ email_verified: 1 }, user.id);

        // create access token
        const token = JwtService.createAccessToken(
          {
            user_id: payload.user_id,
          },
          5 * 1000 * 60,
          process.env.JWT_SECRET
        );

        return res.status(200).json({
          error: false,
          message: "Email verified successfully",
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

  app.post("/v1/api/auth/login", [UrlMiddleware], async function (req, res) {
    try {
      const { email, password } = req.body;
      const validationResult = await ValidationService.validateObject(
        {
          email: "required|email",
          password: "required|string",
        },
        { email, password }
      );
      if (validationResult.error) return res.status(400).json(validationResult);

      const sdk = new BackendSDK();
      sdk.setTable("users");
      const user = (await sdk.get({ email }))[0];
console.log('User object:', user);
      if (!user) {
        return res.status(401).json({
          error: true,
          message: "email and password does not match",
        });
      }

      const isValid = await PasswordService.compareHash(
        password,
        user.password
      );
      if (!isValid) {
        return res.status(401).json({
          error: true,
          message: "password does not match",
        });
      }

      // create access token
      const token = JwtService.createAccessToken(
        {
          user_id: user.id,
          role: user.role || 'unassigned', // Default role if null
          email: user.email,  // Include additional claims
          status: user.status // Include user status if needed
        },
        24 * 60 * 60 * 1000, // Longer expiry (24 hours)
        process.env.JWT_SECRET
      );

      return res.status(200).json({
        error: false,
        message: "login successfully",
        token,
      user: {  // Return complete user data
        id: user.id,
        email: user.email,
        role: user.role,
        // other relevant fields
      }
      });
    } catch (err) {
      console.error(err);
      res.status(500);
      res.json({
        error: true,
        message: "something went wrong",
      });
    }
  });

  app.post(
    "/v1/api/auth/forgot-password",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { email } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            email: "required|email",
          },
          { email }
        );
        if (validationResult.error)
          return res.status(400).json(validationResult);

        const sdk = new BackendSDK();
        sdk.setTable("users");
        const user = (await sdk.get({ email }))[0];
        if (!user) {
          return res.status(401).json({
            error: true,
            message: "email not registered",
          });
        }

        // create access token
        const token = JwtService.createAccessToken(
          {
            user_id: user.id,
            role: user.role,
          },
          5 * 1000 * 60,
          process.env.JWT_SECRET
        );

        const link = `${process.env.FRONTEND_URL}/auth/reset?t=${token}`;
        console.log("reset password link", link);

        const config = {
          mail_host: process.env.MAIL_HOST,
          mail_port: process.env.MAIL_PORT,
          mail_user: process.env.MAIL_USER,
          mail_pass: process.env.MAIL_PASS,
        };
        MailService.initialize(config);

        await MailService.send({
          from: process.env.MAIL_FROM,
          to: email,
          html: MailService.FORGOT_PASSWORD.replace(
            "{{{first_name}}}",
            user.first_name
          ).replace("{{{link}}}", link),
          subject: "Reset your Cohortly password",
        });

        return res.status(200).json({
          error: false,
          message: "password reset requested",
          link,
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
    "/v1/api/auth/reset-password",
    [UrlMiddleware],
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
          return res.status(401).json({
            error: true,
            message: "email not registered",
          });
        }

        const hashedPassword = await PasswordService.hash(password);

        sdk.setTable("users");
        await sdk.update({ password: hashedPassword }, req.user_id);

        return res.status(200).json({
          error: false,
          message: "password reset successfully",
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
