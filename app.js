const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const mainRouter = require("./routes/auth"); // Load auth routes

const app = express();

// --- Middleware ---
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));

// --- Swagger Configuration ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cohortly API",
      version: "1.0.0",
      description: "API documentation for Cohortly backend",
      contact: {
        name: "Cohortly Dev Team",
        email: "support@cohortly.com",
      },
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || "http://localhost:3000",
        description: "Current server",
      },
    ],
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
  apis: ["./routes/*.js"], // Scan all route files for Swagger docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Routes ---
mainRouter(app);

// --- Fallback routes ---
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/", (req, res) => res.redirect("/home"));

// --- Error handling for missing uploads ---
app.use("/uploads", (err, req, res, next) => {
  if (err.code === "ENOENT") {
    return res.status(404).json({ error: true, message: "Image not found" });
  }
  next(err);
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
