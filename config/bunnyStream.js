require("dotenv").config();
const multer = require("multer");
const axios = require("axios"); // Assuming you have axios installed
const streamifier = require("streamifier");

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;

if (!BUNNY_LIBRARY_ID || !BUNNY_ACCESS_KEY) {
  throw new Error("Missing BUNNY_LIBRARY_ID or BUNNY_ACCESS_KEY in .env");
}

// Multer: Keep file in memory (as buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB max
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4",
    "video/quicktime",      // .mov
    "video/x-msvideo",      // .avi
    "video/webm",
    "video/x-matroska",     // ← ADD THIS FOR MKV
    "video/mpg",
    "video/mpeg"];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * Upload video to Bunny Stream (Direct API)
 * @param {Buffer} buffer - Video file buffer
 * @param {Object} options - { title, onProgress }
 * @returns {Promise<Object>} { videoId, playbackUrl, ... }
 */
async function uploadToBunny(buffer, options = {}) {
  const { title = "Untitled Video", onProgress } = options;
  const baseUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`;

  try {
    // Step 1: Create video object (returns GUID)
    const createRes = await axios.post(
      `${baseUrl}`,
      { title },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          AccessKey: BUNNY_ACCESS_KEY,
        },
      }
    );
    const videoId = createRes.data.guid;
    console.log(`Video created with GUID: ${videoId}`);

    // Step 2: Upload file as binary stream
    const stream = streamifier.createReadStream(buffer);
    await axios.put(
      `${baseUrl}/${videoId}`,
      stream,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "video/mp4", // Adjust if needed (e.g., "application/octet-stream")
          AccessKey: BUNNY_ACCESS_KEY,
        },
        maxContentLength: Infinity, // For large files
        // Optional: Progress tracking (requires axios-progress-bar or custom)
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ loaded: progressEvent.loaded, total: progressEvent.total, percent });
          }
        },
      }
    );
    console.log(`Upload complete for ${videoId}`);

    // Step 3: Fetch final video details (optional, for status)
    const finalRes = await axios.get(`${baseUrl}/${videoId}`, {
      headers: { AccessKey: BUNNY_ACCESS_KEY },
    });

    return {
      success: true,
      videoId,
      playbackUrl: `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=false`,
      hlsUrl: `https://video.bunnycdn.com/play/${BUNNY_LIBRARY_ID}/${videoId}/playlist.m3u8`,
      mp4Url: `https://video.bunnycdn.com/play/${BUNNY_LIBRARY_ID}/${videoId}/video.mp4`,
      thumbnailUrl: `https://video.bunnycdn.com/thumbnail/${BUNNY_LIBRARY_ID}/${videoId}.jpg`,
      bunnyVideoObject: finalRes.data,
    };
  } catch (err) {
    console.error("Bunny upload failed:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Delete video from Bunny
 */
async function deleteFromBunny(guid) {
  if (!guid) return;
  try {
    await axios.delete(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${guid}`, {
      headers: { AccessKey: BUNNY_ACCESS_KEY },
    });
    console.log(`Deleted from Bunny: ${guid}`);
  } catch (err) {
    if (err.response?.status !== 404) {
      console.warn("Bunny delete failed:", err.message);
    }
  }
}

/**
 * Convert GUID to playback URL
 */
function getPlaybackUrl(guid) {
  if (!guid) return null;
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}?autoplay=false`;
}

// Export
module.exports = {
  upload,
  uploadToBunny,
  deleteFromBunny,
  getPlaybackUrl,
  BUNNY_LIBRARY_ID,
};