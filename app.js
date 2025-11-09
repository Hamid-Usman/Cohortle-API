const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const authRoutes = require("./routes/auth");
const cohortRoutes = require("./routes/cohort");
const communityRoutes = require("./routes/community");

const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Cohortle API",
      version: "1.0.0",
      description: "API documentation for Cohortle platform",
    },
    servers: [{ url: "http://localhost:18123/v1/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// Routes
authRoutes(app);
cohortRoutes(app);
communityRoutes(app);

// Fallback
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/", (req, res) => res.redirect("/home"));

// Error handling
app.use("/uploads", (err, req, res, next) => {
  if (err.code === "ENOENT") return res.status(404).json({ error: true, message: "Image not found" });
  next(err);
});

// Start server
const PORT = process.env.PORT || 18123;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
