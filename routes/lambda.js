const UrlMiddleware = require("../middleware/UrlMiddleware");
const UploadService = require("../services/UploadService");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = function (app) {
  app.post(
    "/v1/api/lambda/upload",
    [UrlMiddleware, upload.single("file")],
    async function (req, res) {
      try {
        const fileBuffer = req.file.buffer;
        const base64String = fileBuffer.toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${base64String}`;

        const uploadService = new UploadService();
        const url = await uploadService.uploadFile(dataUri);

        return res.status(201).json({
          error: false,
          message: "upload successful",
          url,
        });
      } catch (err) {
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "something went wrong",
        });
      }
    },
  );

  return [];
};
