const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3001; // Single port for unified server

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database Setup
const dbPath = path.join(__dirname, "database.db");
const dbLaunchSitesPath = path.join(__dirname, "launchSites.db");
const dbCountriesPath = path.join(__dirname, "countryCodes.db");
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

// Initialize Database Tables
function initializeDatabase() {
  // Check if the launch_sites table exists
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='launchSites'",
    (err, row) => {
      if (err) {
        console.error("Error checking for launchSites table", err.message);
      } else if (!row) {
        // Attach and copy launch sites
        db.run(`ATTACH DATABASE '${dbLaunchSitesPath}' AS launchSites_db`, (err) => {
          if (err) {
            console.error("Error attaching launchSites.db", err.message);
          } else {
            db.run(
              `CREATE TABLE IF NOT EXISTS launchSites AS SELECT * FROM launchSites_db.launchSites`,
              (err) => {
                if (err) {
                  console.error("Error copying launchSites table", err.message);
                } else {
                  console.log("Copied launchSites table to database.db.");
                }
                db.run(`DETACH DATABASE launchSites_db`);
              }
            );
          }
        });
        
        // Attach and copy country codes
        db.run(`ATTACH DATABASE '${dbCountriesPath}' AS country_codes_db`, (err) => {
          if (err) {
            console.error("Error attaching countryCodes.db", err.message);
          } else {
            db.run(
              `CREATE TABLE IF NOT EXISTS countryCodes AS SELECT * FROM country_codes_db.countryCodes`,
              (err) => {
                if (err) {
                  console.error("Error copying countryCodes table", err.message);
                } else {
                  console.log("Copied countryCodes table to database.db.");
                }
                db.run(`DETACH DATABASE country_codes_db`);
              }
            );
          }
        });
      } else {
        console.log("launchSites and countryCodes tables already exist in database.db.");
      }
    }
  );

  // Create main tables
  db.run(`CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    type TEXT,
    date TEXT,
    glider INTEGER,
    flightStart TEXT,
    flightEnd TEXT,
    takeoffLocation TEXT,
    takeoffCountryCode TEXT,
    landingLocation TEXT,
    landingCountryCode TEXT,
    flightTime TEXT,
    links TEXT,
    comments TEXT,
    igcFilePath TEXT,
    igcSerial TEXT,
    FOREIGN KEY (glider) REFERENCES gear(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS gear (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gear_type TEXT,
    brand TEXT,
    model TEXT,
    manufacturing_date TEXT,
    purchase_date TEXT,
    archived INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gear_id INTEGER,
    maintenance_date TEXT,
    maintenance_type TEXT,
    by_whom TEXT,
    description TEXT,
    FOREIGN KEY (gear_id) REFERENCES gear(id)
  )`);
}

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads", "igc");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}`;
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
const dbUpload = multer({ dest: "uploads/db" });

// Settings file path
const settingsFilePath = path.join(__dirname, "appSettings.json");

// Static file serving
app.use(express.static(path.join(__dirname, "uploads", "igc")));

// ============================================================================
// API ROUTES - FILE MANAGEMENT
// ============================================================================

// Proxy for OpenStreetMap
app.use(
  "/reverse",
  createProxyMiddleware({
    target: "https://nominatim.openstreetmap.org/reverse",
    changeOrigin: true,
    logLevel: "debug",
  })
);

// File upload
app.post("/uploadFile", upload.single("igcFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).json({
    message: "File uploaded successfully",
    filePath: req.file.path,
  });
});

// Read IGC file
app.get("/read-igc", (req, res) => {
  const igcFilePath = req.query.filePath;
  if (!igcFilePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  fs.readFile(igcFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading IGC file:", err);
      return res.status(500).json({ error: "Error reading IGC file" });
    }
    res.json({ content: data });
  });
});

// Delete IGC file
app.delete("/delete-igc-file", (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  fs.unlink(path.resolve(filePath), (err) => {
    if (err) {
      console.error("Error deleting IGC file:", err);
      return res.status(500).json({ error: "Error deleting IGC file" });
    }
    res.json({ message: "IGC file deleted successfully" });
  });
});

// ============================================================================
// API ROUTES - SETTINGS MANAGEMENT
// ============================================================================

app.post("/save-settings", (req, res) => {
  const {
    categories,
    types,
    gliderWarningDuration,
    gliderWarningHours,
    rescueWarningDuration,
  } = req.body;
  
  fs.writeFile(
    settingsFilePath,
    JSON.stringify({
      categories,
      types,
      gliderWarningDuration,
      gliderWarningHours,
      rescueWarningDuration,
    }),
    (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to save settings" });
        return;
      }
      res.json({ message: "Settings saved successfully" });
    }
  );
});

app.get("/get-settings", (req, res) => {
  fs.readFile(settingsFilePath, "utf8", (err, data) => {
    if (err) {
      res.status(500).json({ error: "Failed to read settings" });
      return;
    }
    const settings = JSON.parse(data);
    res.json(settings);
  });
});

// ============================================================================
// API ROUTES - DATABASE OPERATIONS - FLIGHTS
// ============================================================================

app.get("/items", (req, res) => {
  db.all("SELECT * FROM flights", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

app.post("/save-flight", (req, res) => {
  const {
    category,
    type,
    date,
    glider,
    flightStart,
    flightEnd,
    takeoffLocation,
    takeoffCountryCode,
    landingLocation,
    landingCountryCode,
    flightTime,
    links,
    comments,
    igcFilePath,
    igcSerial,
  } = req.body;
  
  db.run(
    "INSERT INTO flights (category, type, date, glider, flightStart, flightEnd, takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode, flightTime, links, comments, igcFilePath, igcSerial) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      category,
      type,
      date,
      glider,
      flightStart,
      flightEnd,
      takeoffLocation,
      takeoffCountryCode,
      landingLocation,
      landingCountryCode,
      flightTime,
      links,
      comments,
      igcFilePath,
      igcSerial,
    ],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.delete("/delete-flight/:id", (req, res) => {
  const flightId = req.params.id;
  db.run("DELETE FROM flights WHERE id = ?", [flightId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Flight deleted", changes: this.changes });
  });
});

app.delete("/items", (req, res) => {
  db.run("DELETE FROM flights", [], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "All items deleted" });
  });
});

// ============================================================================
// API ROUTES - DATABASE OPERATIONS - GEAR
// ============================================================================

app.get("/gear", (req, res) => {
  db.all("SELECT * FROM gear", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

app.post("/gear", (req, res) => {
  const {
    gear_type,
    brand,
    model,
    manufacturing_date,
    purchase_date,
    archived,
  } = req.body;
  
  db.run(
    "INSERT INTO gear (gear_type, brand, model, manufacturing_date, purchase_date, archived) VALUES (?, ?, ?, ?, ?, ?)",
    [gear_type, brand, model, manufacturing_date, purchase_date, archived],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.delete("/gear/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM gear WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Glider deleted", changes: this.changes });
  });
});

app.put("/gear/:id", (req, res) => {
  const { id } = req.params;
  const {
    gear_type,
    brand,
    model,
    manufacturing_date,
    purchase_date,
    archived,
  } = req.body;
  
  db.run(
    "UPDATE gear SET gear_type = ?, brand = ?, model = ?, manufacturing_date = ?, purchase_date = ?, archived = ? WHERE id = ?",
    [gear_type, brand, model, manufacturing_date, purchase_date, archived, id],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: "Gear updated", changes: this.changes });
    }
  );
});

app.patch("/gear/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(updates);
  
  db.run(
    `UPDATE gear SET ${fields} WHERE id = ?`,
    [...values, id],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: "Gear updated", changes: this.changes });
    }
  );
});

// ============================================================================
// API ROUTES - DATABASE OPERATIONS - MAINTENANCE
// ============================================================================

app.get("/maintenance", (req, res) => {
  db.all("SELECT * FROM maintenance", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

app.post("/maintenance", (req, res) => {
  const { gear_id, maintenance_date, maintenance_type, by_whom, description } = req.body;
  
  db.run(
    "INSERT INTO maintenance (gear_id, maintenance_date, maintenance_type, by_whom, description) VALUES (?, ?, ?, ?, ?)",
    [gear_id, maintenance_date, maintenance_type, by_whom, description],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put("/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const { gear_id, maintenance_date, maintenance_type, by_whom, description } = req.body;
  
  db.run(
    "UPDATE maintenance SET gear_id = ?, maintenance_date = ?, maintenance_type = ?, by_whom = ?, description = ? WHERE id = ?",
    [gear_id, maintenance_date, maintenance_type, by_whom, description, id],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: "Maintenance record updated",
        changes: this.changes,
      });
    }
  );
});

app.delete("/maintenance/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM maintenance WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Maintenance record deleted", changes: this.changes });
  });
});

// ============================================================================
// API ROUTES - DATABASE OPERATIONS - REFERENCE DATA
// ============================================================================

app.get("/launch_sites", (req, res) => {
  db.all("SELECT * FROM launchSites", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

app.get("/fetchCountryCodes", (req, res) => {
  db.all("SELECT * FROM countryCodes", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// ============================================================================
// API ROUTES - DATABASE MANAGEMENT
// ============================================================================

app.get("/get-tables", (req, res) => {
  const query = "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'";
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const tables = rows.map((row) => row.name);
    res.json({ tables });
  });
});

app.get("/export-database", (req, res) => {
  const dbFilePath = path.join(__dirname, "database.db");
  res.download(dbFilePath, "database.db", (err) => {
    if (err) {
      res.status(500).json({ error: "Failed to export database" });
    }
  });
});

app.get("/export-csv", (req, res) => {
  const tableName = req.query.table;
  const query = `SELECT * FROM ${tableName}`;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (rows.length === 0) {
      res.header("Content-Type", "text/csv");
      res.attachment(`${tableName}.csv`);
      res.send("");
      return;
    }

    const headers = Object.keys(rows[0]).join(",");
    const csv = rows.map((row) => Object.values(row).join(",")).join("\n");
    const csvWithHeaders = `${headers}\n${csv}`;

    res.header("Content-Type", "text/csv");
    res.attachment(`${tableName}.csv`);
    res.send(csvWithHeaders);
  });
});

app.post("/upload-db", dbUpload.single("dbFile"), (req, res) => {
  const tempdbPath = path.join(__dirname, req.file.path);
  const tempDb = new sqlite3.Database(tempdbPath);

  tempDb.serialize(() => {
    tempDb.all(
      "SELECT name FROM sqlite_master WHERE type='table'",
      (err, tables) => {
        if (err) {
          console.error("Error fetching tables:", err);
          res.status(500).send("Error fetching tables");
        } else {
          const tableNames = tables.map((table) => table.name);
          const requiredTables = [
            "gear",
            "flights",
            "maintenance",
            "countryCodes",
            "launchSites",
          ];
          const missingTables = requiredTables.filter(
            (table) => !tableNames.includes(table)
          );

          if (missingTables.length > 0) {
            res.status(400).json({ error: "Missing tables", missingTables });
          } else {
            db.close((closeErr) => {
              if (closeErr) {
                console.error("Error closing the database:", closeErr);
                res.status(500).send("Error closing the database");
              } else {
                fs.copyFile(tempdbPath, dbPath, (copyErr) => {
                  if (copyErr) {
                    console.error("Error replacing the database:", copyErr);
                    res.status(500).send("Error replacing the database");
                  } else {
                    db = new sqlite3.Database(dbPath, (openErr) => {
                      if (openErr) {
                        console.error("Error opening the database:", openErr);
                        res.status(500).send("Error opening the database");
                      } else {
                        res.json({
                          message: "Database replaced and reloaded successfully.",
                          tables: tableNames,
                        });
                      }
                    });
                  }
                  fs.unlinkSync(tempdbPath);
                });
              }
            });
          }
        }
        tempDb.close();
      }
    );
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(port, () => {
  console.log(`🚀 Paradash Server running on port ${port}`);
  console.log(`📊 Database API: http://localhost:${port}`);
  console.log(`📁 File API: http://localhost:${port}`);
  console.log(`⚙️  Settings API: http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed.');
    }
    process.exit(0);
  });
});
