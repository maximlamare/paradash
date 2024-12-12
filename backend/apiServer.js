const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(cors());

app.use(
  "/reverse",
  createProxyMiddleware({
    target: "https://nominatim.openstreetmap.org/reverse",
    changeOrigin: true,
    logLevel: "debug",
  })
);

// For settings file
const settingsFilePath = path.join(__dirname, "appSettings.json");

app.post("/save-settings", (req, res) => {
  const { categories, types, gliderWarningDuration, rescueWarningDuration } =
    req.body;
  fs.writeFile(
    settingsFilePath,
    JSON.stringify({
      categories,
      types,
      gliderWarningDuration,
      rescueWarningDuration,
    }),
    (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to save categories" });
        return;
      }
      res.json({ message: "Categories saved successfully" });
    }
  );
});

app.get("/get-settings", (req, res) => {
  fs.readFile(settingsFilePath, "utf8", (err, data) => {
    if (err) {
      res.status(500).json({ error: "Failed to read categories" });
      return;
    }
    const settings = JSON.parse(data);
    res.json(settings);
  });
});

// FILE MANAGEMENT
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads", "igc");
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}`;
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Route for file upload
app.post("/uploadFile", upload.single("igcFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).json({
    message: "File uploaded successfully",
    filePath: req.file.path, // Include the file path in the response
  });
});

app.listen(port, () => {
  console.log(`API proxy server running on port ${port}`);
});
