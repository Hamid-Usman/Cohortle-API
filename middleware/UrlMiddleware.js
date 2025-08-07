module.exports = function (req, res, next) {
  console.log("Request URL:", req.originalUrl);
  const ipAddress = req.headers
    ? req.headers["x-forwarded-for"]
    : req.connection?.remoteAddress;
  req.ipAddr = ipAddress;

  next();
};
