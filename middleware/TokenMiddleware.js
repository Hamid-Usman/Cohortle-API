const JwtService = require("../services/JwtService");

module.exports = function (options) {
  return function (req, res, next) {
    const token = JwtService.getToken(req);
    if (!token) {
      return res.status(401).json({
        error: true,
        message: "UNAUTHORIZED",
        code: "UNAUTHORIZED",
      });
    } else {
      const result = JwtService.verifyAccessToken(
        token,
        process.env.JWT_SECRET,
        options
      );
      if (!result) {
        return res.status(401).json({
          error: true,
          message: "TOKEN_EXPIRED",
          code: "TOKEN_EXPIRED",
        });
      }

      req.user_id = result.user_id;
      req.role = result.role;
      // ✅ Role restriction logic (optional)
      if (options.role) {
        const allowedRoles = options.role.split("|");
        if (!allowedRoles.includes(req.role)) {
          return res.status(403).json({
            error: true,
            message: "FORBIDDEN",
            code: "FORBIDDEN",
          });
        }
      }
      next();
    }
  };
};
