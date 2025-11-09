let express = require("express");
let path = require("path");
let logger = require("morgan");
let cors = require("cors");
const fs = require("fs");

const mainRouter = require("./routes");

let app = express();

let BackendSDK = require("./core/BackendSDK.js");
let sdk = new BackendSDK();

app.set("sdk", sdk);
app.enable("trust proxy");

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(logger("dev"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/home", function (req, res, next) {
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/", function (req, res) {
  return res.redirect("/home");
});

mainRouter(app);

// Error handling for static files
app.use("/uploads", (err, req, res, next) => {
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: true,
      message: "Image not found"
    });
  }
  next(err);
});

module.exports = app;