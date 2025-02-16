const express = require("express");
const path = require("path");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = 3000;
const upload = multer({ dest: "uploads/db" });

app.use(bodyParser.json());
app.use(cors());

const dbPath = path.join(__dirname, "database.db");
const dbLaunchSitesPath = path.join(__dirname, "launchSites.db");
const dbCountriesPath = path.join(__dirname, "countryCodes.db");
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    // Check if the launch_sites table exists
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='launchSites'",
      (err, row) => {
        if (err) {
          console.error("Error checking for launchSites table", err.message);
        } else if (!row) {
          // Attach the launch_sites.db database
          db.run(
            `ATTACH DATABASE '${dbLaunchSitesPath}' AS launchSites_db`,
            (err) => {
              if (err) {
                console.error("Error attaching launchSites.db", err.message);
              } else {
                console.log("Attached launchSites.db database.");

                // Copy the launch_sites table from launch_sites.db to database.db
                db.run(
                  `CREATE TABLE IF NOT EXISTS launchSites AS SELECT * FROM launchSites_db.launchSites`,
                  (err) => {
                    if (err) {
                      console.error(
                        "Error copying launchSites table",
                        err.message
                      );
                    } else {
                      console.log("Copied launchSites table to database.db.");
                    }

                    // Detach the launch_sites.db database
                    db.run(`DETACH DATABASE launchSites_db`, (err) => {
                      if (err) {
                        console.error(
                          "Error detaching launchSites.db",
                          err.message
                        );
                      } else {
                        console.log("Detached launchSites.db database.");
                      }
                    });
                  }
                );
              }
            }
          );
          // Attach the countryCodes.db database
          db.run(
            `ATTACH DATABASE '${dbCountriesPath}' AS country_codes_db`,
            (err) => {
              if (err) {
                console.error("Error attaching countryCodes.db", err.message);
              } else {
                console.log("Attached countryCodes.db database.");

                // Copy the launch_sites table from launch_sites.db to database.db
                db.run(
                  `CREATE TABLE IF NOT EXISTS countryCodes AS SELECT * FROM country_codes_db.countryCodes`,
                  (err) => {
                    if (err) {
                      console.error(
                        "Error copying countryCodes table",
                        err.message
                      );
                    } else {
                      console.log("Copied countryCodes table to database.db.");
                    }

                    // Detach the launch_sites.db database
                    db.run(`DETACH DATABASE country_codes_db`, (err) => {
                      if (err) {
                        console.error(
                          "Error detaching countryCodes.db",
                          err.message
                        );
                      } else {
                        console.log("Detached Country Codes database.");
                      }
                    });
                  }
                );
              }
            }
          );
        } else {
          console.log(
            "launchSites and countryCodes tables already exists in database.db."
          );
        }
      }
    );
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
});
// Fetching tables for export
app.get("/get-tables", (req, res) => {
  const query =
    "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'";
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const tables = rows.map((row) => row.name);
    res.json({ tables });
  });
});
const dbFilePath = path.join(__dirname, "database.db");

app.get("/export-database", (req, res) => {
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
// GEAR DATABASE
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
  const updates = req.body; // Ensure updates is defined
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

// MAINTENANCE DATABASE
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
  const { gear_id, maintenance_date, maintenance_type, by_whom, description } =
    req.body;
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
  const { gear_id, maintenance_date, maintenance_type, by_whom, description } =
    req.body;
  db.run(
    "UPDATE maintenance SET gear_id = ?, maintenance_date = ?, maintenance_type = ?, by_whom = ?, description = ?, WHERE id = ?",
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

// FLYING SITES
// API endpoint to get launch site by coordinates
app.get("/launch_sites", (req, res) => {
  db.all("SELECT * FROM launchSites", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// FLIGHTS
// Get all items
app.get("/items", (req, res) => {
  db.all("SELECT * FROM flights", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Add a new item
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

// Delete all items
app.delete("/items", (req, res) => {
  db.run("DELETE FROM flights", [], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "All items deleted" });
  });
});

// Delete a single flight by id
// DELETE endpoint to delete a flight by ID
app.delete("/delete-flight/:id", (req, res) => {
  const flightId = req.params.id;
  // Delete the flight from the database
  db.run("DELETE FROM flights WHERE id = ?", [flightId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Flight deleted", changes: this.changes });
  });
});

// Country codes
app.get("/fetchCountryCodes", (req, res) => {
  db.all("SELECT * FROM countryCodes", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// The rest should be sorted later
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Check a input database from settings
app.post("/upload-db", upload.single("dbFile"), (req, res) => {
  const tempdbPath = path.join(__dirname, req.file.path);
  const tempDb = new sqlite3.Database(dbPath);

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
            // Close the current database connection
            db.close((closeErr) => {
              if (closeErr) {
                console.error("Error closing the database:", closeErr);
                res.status(500).send("Error closing the database");
              } else {
                // Replace the current database with the uploaded database
                fs.copyFile(tempdbPath, dbPath, (copyErr) => {
                  if (copyErr) {
                    console.error("Error replacing the database:", copyErr);
                    res.status(500).send("Error replacing the database");
                  } else {
                    // Reopen the database connection
                    db = new sqlite3.Database(dbPath, (openErr) => {
                      if (openErr) {
                        console.error("Error opening the database:", openErr);
                        res.status(500).send("Error opening the database");
                      } else {
                        res.json({
                          message:
                            "All required tables are present. Database replaced and reloaded successfully.",
                          tables: tableNames,
                        });
                      }
                    });
                  }
                  fs.unlinkSync(tempdbPath); // Clean up the uploaded file
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
