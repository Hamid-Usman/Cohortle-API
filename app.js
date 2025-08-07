let express = require("express");
let path = require("path");
let logger = require("morgan");
let cors = require("cors");
const mainRouter = require("./routes");

let app = express();
const fs = require("fs");

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
app.use(express.static(path.join(__dirname, "uploads")));

app.get("/home", function (req, res, next) {
  return res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/", function (req, res) {
  return res.redirect("/home");
});

mainRouter(app);

module.exports = app;
