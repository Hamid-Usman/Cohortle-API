const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const authRoutes = require("./routes/auth");
const cohortRoutes = require("./routes/cohort");
const communityRoutes = require("./routes/community");
const profileRoutes = require("./routes/profile");

const app = express();

// =====================
// Middleware
// =====================
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));

// =====================
// Swagger / OpenAPI
// =====================
const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Cohortle API",
      version: "1.0.0",
      description: "API documentation for Cohortle platform",
    },
    servers: [{ url: "http://localhost:18123" }],
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
  apis: [path.join(__dirname, "routes/*.js")], // Path to your route files with Swagger annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve OpenAPI JSON (for Redoc)
app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

// Serve Redoc
app.get("/docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cohortle API Docs</title>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </head>
      <body>
        <redoc spec-url='/openapi.json'></redoc>
      </body>
    </html>
  `);
});

// =====================
// API Routes
// =====================
authRoutes(app);
cohortRoutes(app);
communityRoutes(app);
profileRoutes(app);

// =====================
// Fallback Routes
// =====================
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/", (req, res) => res.redirect("/home"));

// =====================
// Error Handling
// =====================
app.use("/uploads", (err, req, res, next) => {
  if (err.code === "ENOENT") return res.status(404).json({ error: true, message: "Image not found" });
  next(err);
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 18123;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
