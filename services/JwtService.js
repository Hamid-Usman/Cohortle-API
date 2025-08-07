/*Powered By: Manaknightdigital Inc. https://manaknightdigital.com/ Year: 2020*/
/**
 * JWT Service
 * @copyright 2020 Manaknightdigital Inc.
 * @link https://manaknightdigital.com
 * @license Proprietary Software licensing
 * @author Ryan Wong
 *
 */
var jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

module.exports = {
  createAccessToken: function (payload, expireIn, secret) {
    return jwt.sign(payload, secret, {
      expiresIn: Number(expireIn),
      algorithm: "HS256",
    });
  },
  createRefreshToken: function (payload, key, expireAt) {
    return jwt.sign(payload, key, {
      expiresIn: Number(expireAt),
      algorithm: "HS256",
    });
  },

  verifyAccessToken: function (token, key, options = {}) {
    try {
      const decoded = jwt.verify(token, key, options);
      if (decoded) {
        if (options.allowNull) {
          return decoded;
        }
        for (const key of Object.keys(options)) {
          if (key == "role" && decoded.role.split(",").length > 1) {
            const user_roles = decoded.role.split(",");
            const roles = options[key].split("|");
            if (
              user_roles.filter((value) => roles.includes(value)).length == 0
            ) {
              return false;
            }
          } else if (!options[key].split("|").includes(decoded[key])) {
            return false;
          }
        }
        return decoded;
      }
    } catch (err) {
      return false;
    }
  },

  verifyRefreshToken: function (token, key, options = {}) {
    try {
      return jwt.verify(token, key, options);
    } catch (err) {
      return false;
    }
  },
  generateString: function (length) {
    let d = new Date().getTime();
    const time = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx-xxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
      }
    );

    return (uuid.toUpperCase() + "-" + time.toString()).substring(0, length);
  },
  generateUUID: function () {
    let d = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
      }
    );
    return uuid.toUpperCase();
  },
  getToken: function (req) {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      return req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies["access_token"]) {
      return req.cookies["access_token"];
    }

    return null;
  },
  verifyTokenMiddleware: function (key, options) {
    const self = this;
    return function (req, res, next) {
      const token = self.getToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "UNAUTHORIZED",
          code: "UNAUTHORIZED",
        });
      } else {
        const result = self.verifyAccessToken(token, key, options);
        if (!result) {
          return res.status(401).json({
            success: false,
            message: "TOKEN_EXPIRED",
            code: "TOKEN_EXPIRED",
          });
        }
        req.user_id = result.user_id;
        req.role = result.role;
        next();
      }
    };
  },

  getAppleSigningKeys: async function (kid) {
    const client = jwksClient({
      jwksUri: "https://appleid.apple.com/auth/keys",
    });

    return new Promise(function (resolve, reject) {
      client.getSigningKey(kid, (err, result) => {
        if (!result) resolve(null);
        resolve(result.getPublicKey());
      });
    });
  },
  verifyAppleLogin: async function (data, appleKey) {
    return new Promise(function (resolve, reject) {
      jwt.verify(data, appleKey, (err, payload) => {
        if (err) {
          throw new Error(err.message);
        }
        return resolve(payload);
      });
    });
  },
};
