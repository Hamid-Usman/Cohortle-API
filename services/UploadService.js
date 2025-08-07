const cloudinary = require("cloudinary").v2;

class UploadService {
  constructor() {
    cloudinary.config({
      secure: true,
    });
  }

  async uploadFile(filePath) {
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };
    const result = await cloudinary.uploader.upload(filePath, options);
    return result.secure_url;
  }
}

module.exports = UploadService;
