const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(cors());

app.use(
  "/api",
  createProxyMiddleware({
    target: "https://www.paragliding.earth/api",
    changeOrigin: true,
    logLevel: "debug",
  })
);
app.use(
  "/reverse",
  createProxyMiddleware({
    target: "https://nominatim.openstreetmap.org/reverse",
    changeOrigin: true,
    logLevel: "debug",
  })
);

app.listen(port, () => {
  console.log(`API proxy server running on port ${port}`);
});
