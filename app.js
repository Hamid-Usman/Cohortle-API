const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const authRoutes = require("./routes/auth");
const cohortRoutes = require("./routes/cohort");
const communityRoutes = require("./routes/community");
const programmeRoutes = require("./routes/programme");
const moduleRoutes = require("./routes/module");
const lessonRoutes = require("./routes/lesson");
const profileRoutes = require("./routes/profile");
const activityRoutes = require("./routes/activity");
const announcementRoutes = require("./routes/announcement");
const discussionRoutes = require("./routes/discussion");
const lessonProgressRoutes = require("./routes/lesson_progress");
const scheduleRoutes = require("./routes/schedule");
const lessonCommentRoutes = require("./routes/lesson_comment");

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
    servers: [{ url: "http://localhost:8000" }, { url: process.env.VPS_ADDRESS }],
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
        <title>Cohortle API Docs 0.0.1 </title>
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
communityRoutes(app);
programmeRoutes(app);
cohortRoutes(app);
moduleRoutes(app);
lessonRoutes(app);
profileRoutes(app);
activityRoutes(app);
announcementRoutes(app);
discussionRoutes(app);
lessonProgressRoutes(app);
scheduleRoutes(app);
lessonCommentRoutes(app);

// =====================
// Fallback Routes
// =====================
app.get("/api-docs", (req, res) =>
  res.sendFile(path.join(__dirname, "index.html")),
);
app.get("/", (req, res) => res.redirect("/api-docs"));

// =====================
// Error Handling
// =====================
app.use("/uploads", (err, req, res, next) => {
  if (err.code === "ENOENT")
    return res.status(404).json({ error: true, message: "Image not found" });
  next(err);
});

// =====================
// Start Server
// =====================
const PORT = 8000
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
