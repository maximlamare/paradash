const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const dbPath = path.join(__dirname, "database.db");
const dbLaunchSitesPath = path.join(__dirname, "launch_sites.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    // Check if the launch_sites table exists
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='launch_sites'",
      (err, row) => {
        if (err) {
          console.error("Error checking for launch_sites table", err.message);
        } else if (!row) {
          // Attach the launch_sites.db database
          db.run(
            `ATTACH DATABASE '${dbLaunchSitesPath}' AS launch_sites_db`,
            (err) => {
              if (err) {
                console.error("Error attaching launch_sites.db", err.message);
              } else {
                console.log("Attached launch_sites.db database.");

                // Copy the launch_sites table from launch_sites.db to database.db
                db.run(
                  `CREATE TABLE IF NOT EXISTS launch_sites AS SELECT * FROM launch_sites_db.launch_sites`,
                  (err) => {
                    if (err) {
                      console.error(
                        "Error copying launch_sites table",
                        err.message
                      );
                    } else {
                      console.log("Copied launch_sites table to database.db.");
                    }

                    // Detach the launch_sites.db database
                    db.run(`DETACH DATABASE launch_sites_db`, (err) => {
                      if (err) {
                        console.error(
                          "Error detaching launch_sites.db",
                          err.message
                        );
                      } else {
                        console.log("Detached launch_sites.db database.");
                      }
                    });
                  }
                );
              }
            }
          );
        } else {
          console.log("launch_sites table already exists in database.db.");
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
            takeoffLocation TEXT,
            takeoffCountryCode TEXT,
            landingLocation TEXT,
            landingCountryCode TEXT,
            flightTime TEXT,
            links TEXT,
            comments TEXT,
            igcFilePath TEXT,
            FOREIGN KEY (glider) REFERENCES gear(id)

        )`);
    db.run(`CREATE TABLE IF NOT EXISTS gear (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gear_type TEXT,
            brand TEXT,
            model TEXT,
            manufacturing_date TEXT,
            purchase_date TEXT,
            total_flight_time INTEGER,
            number_of_flights INTEGER
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
    total_flight_time,
    number_of_flights,
  } = req.body;
  db.run(
    "INSERT INTO gear (gear_type, brand, model, manufacturing_date, purchase_date, total_flight_time, number_of_flights) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      gear_type,
      brand,
      model,
      manufacturing_date,
      purchase_date,
      total_flight_time,
      number_of_flights,
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
    total_flight_time,
    number_of_flights,
  } = req.body;
  db.run(
    "UPDATE gear SET gear_type = ?, brand = ?, model = ?, manufacturing_date = ?, purchase_date = ?, total_flight_time = ?, number_of_flights = ? WHERE id = ?",
    [
      gear_type,
      brand,
      model,
      manufacturing_date,
      purchase_date,
      total_flight_time,
      number_of_flights,
      id,
    ],
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
  db.all("SELECT * FROM launch_sites", [], (err, rows) => {
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
    takeoffLocation,
    takeoffCountryCode,
    landingLocation,
    landingCountryCode,
    flightTime,
    links,
    comments,
    igcFilePath,
  } = req.body;
  db.run(
    "INSERT INTO flights (category, type, date, glider, flightStart, takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode, flightTime, links, comments, igcFilePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      category,
      type,
      date,
      glider,
      flightStart,
      takeoffLocation,
      takeoffCountryCode,
      landingLocation,
      landingCountryCode,
      flightTime,
      links,
      comments,
      igcFilePath,
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

// The rest should be sorted later
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
