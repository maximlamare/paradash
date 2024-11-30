const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

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

app.listen(port, () => {
  console.log(`API proxy server running on port ${port}`);
});
