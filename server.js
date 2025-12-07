import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import IGCParser from "igc-parser";
import archiver from "archiver";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { calculateIGCDistances } from "./src/utils/igcUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(
  cors({
    exposedHeaders: ["Content-Disposition"],
  })
);

// Database Setup
const dbPath = path.join(__dirname, "src", "data", "flights.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// IGC Files Setup
const igcDir = path.join(__dirname, "src", "data", "igc");
if (!fs.existsSync(igcDir)) {
  fs.mkdirSync(igcDir, { recursive: true });
}

// Multer configuration for IGC file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Upload to temp directory first for duplicate checking
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Keep the original filename with timestamp to avoid conflicts
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only accept .igc files
    if (path.extname(file.originalname).toLowerCase() === ".igc") {
      cb(null, true);
    } else {
      cb(new Error("Only IGC files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Multer configuration for PDF attachment uploads
const attachmentDir = path.join(__dirname, "src", "data", "attachments");
if (!fs.existsSync(attachmentDir)) {
  fs.mkdirSync(attachmentDir, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, attachmentDir);
  },
  filename: function (req, file, cb) {
    // Keep the original filename with timestamp to avoid conflicts
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: function (req, file, cb) {
    // Only accept PDF files
    if (path.extname(file.originalname).toLowerCase() === ".pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for PDFs
  },
});

// Multer configuration for database import uploads
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const importStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadImport = multer({
  storage: importStorage,
  fileFilter: function (req, file, cb) {
    // Accept .db, .csv, and .zip files for imports
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".db" || ext === ".csv" || ext === ".zip") {
      cb(null, true);
    } else {
      cb(new Error("Only .db, .csv, or .zip files are allowed for import!"), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for backup files
  },
});

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON", (err) => {
      if (err) {
        console.error("Error enabling foreign keys:", err.message);
      } else {
        console.log("Foreign keys enabled");
      }
    });
    initializeDatabase();
  }
});

// Initialize Database Tables
function initializeDatabase() {
  const createGearTable = `
    CREATE TABLE IF NOT EXISTS gear (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manufacturer TEXT NOT NULL,
      type TEXT NOT NULL,
      model TEXT NOT NULL,
      manufacturing_date TEXT,
      purchase_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createFlightsTable = `
    CREATE TABLE IF NOT EXISTS flights (
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
      trackDistance REAL,
      straightDistance REAL,
      maxAltitude INTEGER,
      links TEXT,
      comments TEXT,
      igcFilePath TEXT,
      igcSerial TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (glider) REFERENCES gear(id)
    )
  `;

  const createMaintenanceTable = `
    CREATE TABLE IF NOT EXISTS gear_maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gear_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      attachment_path TEXT,
      attachment_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gear_id) REFERENCES gear(id) ON DELETE CASCADE
    )
  `;

  db.run(createGearTable, (err) => {
    if (err) {
      console.error("Error creating gear table:", err.message);
    } else {
      console.log("Gear table ready");
    }
  });

  db.run(createFlightsTable, (err) => {
    if (err) {
      console.error("Error creating flights table:", err.message);
    } else {
      console.log("Flights table ready");
    }
  });

  db.run(createMaintenanceTable, (err) => {
    if (err) {
      console.error("Error creating maintenance table:", err.message);
    } else {
      console.log("Maintenance table ready");
    }
  });
}

// Initialize database
initializeDatabase();

// ============================================================================
// API ROUTES - FLIGHTS
// ============================================================================

// Get all flights with gear information
app.get("/api/flights", (req, res) => {
  db.all(
    `
    SELECT f.*, g.manufacturer, g.model 
    FROM flights f 
    LEFT JOIN gear g ON f.glider = g.id 
    ORDER BY f.date DESC, f.flightStart DESC
  `,
    [],
    (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ data: rows });
    }
  );
});

// Get single flight by ID with gear information
app.get("/api/flights/:id", (req, res) => {
  const flightId = req.params.id;

  db.get(
    `
    SELECT f.*, g.manufacturer, g.model 
    FROM flights f 
    LEFT JOIN gear g ON f.glider = g.id 
    WHERE f.id = ?
  `,
    [flightId],
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Flight not found" });
        return;
      }
      res.json({ data: row });
    }
  );
});

// Add new flight
app.post("/api/flights", async (req, res) => {
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

  // Calculate distances if IGC file is provided
  let trackDistance = null;
  let straightDistance = null;
  let maxAltitude = null;

  if (igcFilePath) {
    try {
      const fullIgcPath = path.join(
        __dirname,
        "src",
        "data",
        "igc",
        igcFilePath
      );
      const igcContent = fs.readFileSync(fullIgcPath, "utf-8");
      const distances = calculateIGCDistances(igcContent);
      trackDistance = distances.trackDistance;
      straightDistance = distances.straightDistance;
      maxAltitude = distances.maxAltitude;
    } catch (error) {
      console.error("Error calculating distances from IGC:", error);
      // Continue without distances rather than failing the entire request
    }
  }

  const stmt = db.prepare(`
    INSERT INTO flights (category, type, date, glider, flightStart, flightEnd, takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode, flightTime, trackDistance, straightDistance, maxAltitude, links, comments, igcFilePath, igcSerial)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
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
      trackDistance,
      straightDistance,
      maxAltitude,
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

  stmt.finalize();
});

// Update flight
app.put("/api/flights/:id", async (req, res) => {
  const { id } = req.params;
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

  // Calculate distances if IGC file is provided
  let trackDistance = null;
  let straightDistance = null;
  let maxAltitude = null;

  if (igcFilePath) {
    try {
      const fullIgcPath = path.join(
        __dirname,
        "src",
        "data",
        "igc",
        igcFilePath
      );
      const igcContent = fs.readFileSync(fullIgcPath, "utf-8");
      const distances = calculateIGCDistances(igcContent);
      trackDistance = distances.trackDistance;
      straightDistance = distances.straightDistance;
      maxAltitude = distances.maxAltitude;
    } catch (error) {
      console.error("Error calculating distances from IGC:", error);
      // Continue without distances rather than failing the entire request
    }
  }

  const stmt = db.prepare(`
    UPDATE flights 
    SET category = ?, type = ?, date = ?, glider = ?, flightStart = ?, flightEnd = ?, 
        takeoffLocation = ?, takeoffCountryCode = ?, landingLocation = ?, landingCountryCode = ?, 
        flightTime = ?, trackDistance = ?, straightDistance = ?, maxAltitude = ?, links = ?, comments = ?, 
        igcFilePath = ?, igcSerial = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
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
      trackDistance,
      straightDistance,
      maxAltitude,
      links,
      comments,
      igcFilePath,
      igcSerial,
      id,
    ],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: "Flight updated", changes: this.changes });
    }
  );

  stmt.finalize();
});

// Delete flight
app.delete("/api/flights/:id", (req, res) => {
  const { id } = req.params;

  // First, get the flight to find the IGC file path
  db.get("SELECT igcFilePath FROM flights WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    // Delete the flight from database
    const stmt = db.prepare("DELETE FROM flights WHERE id = ?");
    stmt.run([id], function (deleteErr) {
      if (deleteErr) {
        res.status(400).json({ error: deleteErr.message });
        return;
      }

      // If there was an IGC file associated, try to delete it
      if (row && row.igcFilePath) {
        const igcFilePath = path.join(igcDir, row.igcFilePath);
        if (fs.existsSync(igcFilePath)) {
          try {
            fs.unlinkSync(igcFilePath);
            console.log(`Deleted IGC file: ${row.igcFilePath}`);
          } catch (fileErr) {
            console.error(`Failed to delete IGC file: ${fileErr.message}`);
            // Don't fail the request if file deletion fails
          }
        }
      }

      res.json({ message: "Flight deleted", changes: this.changes });
    });

    stmt.finalize();
  });
});

// ============================================================================
// API ROUTES - GEAR
// ============================================================================

// Get all gear
app.get("/api/gear", (req, res) => {
  db.all(
    "SELECT * FROM gear ORDER BY type, purchase_date DESC",
    [],
    (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ data: rows });
    }
  );
});

// Get all gear with flight statistics
app.get("/api/gear/with-stats", (req, res) => {
  const query = `
    SELECT 
      g.*,
      CASE 
        WHEN g.type = 'gliders' THEN COUNT(f.id)
        ELSE 0
      END as flight_count,
      CASE 
        WHEN g.type = 'gliders' THEN COALESCE(SUM(
          CASE 
            WHEN f.flightTime IS NOT NULL AND f.flightTime != '' 
            THEN (
              CAST(substr(f.flightTime, 1, instr(f.flightTime, ':') - 1) AS INTEGER) * 60 +
              CAST(substr(f.flightTime, instr(f.flightTime, ':') + 1) AS INTEGER)
            )
            ELSE 0
          END
        ), 0)
        ELSE 0
      END as total_flight_minutes
    FROM gear g
    LEFT JOIN flights f ON g.id = f.glider AND g.type = 'gliders'
    GROUP BY g.id
    ORDER BY g.type, g.purchase_date DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    // Convert total minutes back to hours:minutes format
    const gearWithStats = rows.map((row) => ({
      ...row,
      total_flight_time:
        row.total_flight_minutes > 0
          ? `${Math.floor(row.total_flight_minutes / 60)}:${String(
              row.total_flight_minutes % 60
            ).padStart(2, "0")}`
          : "0:00",
    }));

    res.json({ data: gearWithStats });
  });
});

// Get gear by ID
app.get("/api/gear/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM gear WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Gear not found" });
      return;
    }
    res.json({ data: row });
  });
});

// Add new gear
app.post("/api/gear", (req, res) => {
  const { manufacturer, model, type, manufacturing_date, purchase_date } =
    req.body;

  const stmt = db.prepare(`
    INSERT INTO gear (manufacturer, model, type, manufacturing_date, purchase_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    [manufacturer, model, type, manufacturing_date, purchase_date],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      const gearId = this.lastID;

      // Automatically create a purchase maintenance record if purchase_date is provided
      if (purchase_date) {
        const maintenanceStmt = db.prepare(`
          INSERT INTO gear_maintenance (gear_id, date, category, description)
          VALUES (?, ?, ?, ?)
        `);

        maintenanceStmt.run(
          [
            gearId,
            purchase_date,
            "Purchase",
            `Initial purchase of ${manufacturer} ${model}`,
          ],
          function (maintenanceErr) {
            if (maintenanceErr) {
              console.error(
                "Error creating purchase maintenance record:",
                maintenanceErr.message
              );
              // Don't fail the gear creation if maintenance record fails
            } else {
              console.log(
                "Purchase maintenance record created for gear ID:",
                gearId
              );
            }
          }
        );

        maintenanceStmt.finalize();
      }

      res.json({ id: gearId });
    }
  );

  stmt.finalize();
});

// Get flights for specific gear ID
app.get("/api/gear/:id/flights", (req, res) => {
  const { id } = req.params;

  db.all(
    `
    SELECT f.*
    FROM flights f 
    WHERE f.glider = ?
    ORDER BY f.date DESC, f.flightStart DESC
  `,
    [id],
    (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ data: rows });
    }
  );
});

// Update gear
app.put("/api/gear/:id", (req, res) => {
  const { id } = req.params;
  const { manufacturer, model, type, manufacturing_date, purchase_date } =
    req.body;

  const stmt = db.prepare(`
    UPDATE gear 
    SET manufacturer = ?, model = ?, type = ?, manufacturing_date = ?, purchase_date = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    [manufacturer, model, type, manufacturing_date, purchase_date, id],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: "Gear updated", changes: this.changes });
    }
  );

  stmt.finalize();
});

// Delete gear
app.delete("/api/gear/:id", (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare("DELETE FROM gear WHERE id = ?");
  stmt.run([id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Gear deleted", changes: this.changes });
  });

  stmt.finalize();
});

// Toggle gear active/retired status
app.patch("/api/gear/:id/active", (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const stmt = db.prepare(`
    UPDATE gear 
    SET is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run([is_active, id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Gear status updated", changes: this.changes });
  });

  stmt.finalize();
});

// ============================================================================
// API ROUTES - MAINTENANCE
// ============================================================================

// Get maintenance records for a gear item
app.get("/api/gear/:id/maintenance", (req, res) => {
  const { id } = req.params;

  db.all(
    "SELECT * FROM gear_maintenance WHERE gear_id = ? ORDER BY date DESC",
    [id],
    (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ data: rows });
    }
  );
});

// Get all maintenance records
app.get("/api/maintenance", (req, res) => {
  db.all(
    "SELECT * FROM gear_maintenance ORDER BY date DESC",
    [],
    (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ data: rows });
    }
  );
});

// Add maintenance record
app.post("/api/gear/:id/maintenance", (req, res) => {
  const { id } = req.params;
  const { date, category, description, attachment_path, attachment_filename } =
    req.body;

  const stmt = db.prepare(`
    INSERT INTO gear_maintenance (gear_id, date, category, description, attachment_path, attachment_filename)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    [id, date, category, description, attachment_path, attachment_filename],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        gear_id: id,
        date,
        category,
        description,
        attachment_path,
        attachment_filename,
      });
    }
  );

  stmt.finalize();
});

// Update maintenance record
app.put("/api/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const { date, category, description, attachment_path, attachment_filename } =
    req.body;

  const stmt = db.prepare(`
    UPDATE gear_maintenance 
    SET date = ?, category = ?, description = ?, attachment_path = ?, attachment_filename = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    [date, category, description, attachment_path, attachment_filename, id],
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

  stmt.finalize();
});

// Delete maintenance record
app.delete("/api/maintenance/:id", (req, res) => {
  const { id } = req.params;

  // First get the maintenance record to find the attachment file
  db.get(
    "SELECT attachment_path FROM gear_maintenance WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      // Delete the maintenance record
      const stmt = db.prepare("DELETE FROM gear_maintenance WHERE id = ?");
      stmt.run([id], function (deleteErr) {
        if (deleteErr) {
          res.status(400).json({ error: deleteErr.message });
          return;
        }

        // If there was an attachment file, try to delete it
        if (row && row.attachment_path) {
          const attachmentPath = path.join(
            __dirname,
            "src",
            "data",
            "attachments",
            row.attachment_path
          );
          if (fs.existsSync(attachmentPath)) {
            try {
              fs.unlinkSync(attachmentPath);
              console.log(`Deleted attachment file: ${row.attachment_path}`);
            } catch (fileErr) {
              console.error(
                `Failed to delete attachment file: ${fileErr.message}`
              );
              // Don't fail the request if file deletion fails
            }
          }
        }

        res.json({
          message: "Maintenance record deleted",
          changes: this.changes,
        });
      });

      stmt.finalize();
    }
  );
});

// Delete attachment file only
app.delete("/api/maintenance/delete-file/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);

  const attachmentPath = path.join(
    __dirname,
    "src",
    "data",
    "attachments",
    filename
  );

  if (fs.existsSync(attachmentPath)) {
    try {
      fs.unlinkSync(attachmentPath);
      console.log(`Deleted attachment file: ${filename}`);
      res.json({ message: "File deleted successfully" });
    } catch (fileErr) {
      console.error(`Failed to delete attachment file: ${fileErr.message}`);
      res.status(500).json({ error: "Failed to delete file" });
    }
  } else {
    // File doesn't exist, but that's ok - might have been already deleted
    res.json({ message: "File not found (may have been already deleted)" });
  }
});

// Upload PDF attachment for maintenance
app.post(
  "/api/maintenance/upload-pdf",
  uploadPdf.single("pdfFile"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    res.json({
      message: "PDF uploaded successfully",
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.filename, // Store just the filename, not full path
    });
  }
);

// Serve PDF files
app.get("/api/maintenance/pdf/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(attachmentDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "PDF file not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  res.sendFile(filePath);
});

// ============================================================================
// API ROUTES - DATABASE EXPORT
// ============================================================================

// Export database as file download (with optional table filtering)
app.post("/api/export/database", (req, res) => {
  const { tables } = req.body;
  const allowedTables = ["flights", "gear", "gear_maintenance"];

  // If no tables specified or empty array, export full database
  if (!tables || tables.length === 0) {
    res.download(dbPath, "flights.db", (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to export database" });
      }
    });
    return;
  }

  // Validate table names
  const invalidTables = tables.filter((t) => !allowedTables.includes(t));
  if (invalidTables.length > 0) {
    return res.status(400).json({ error: "Invalid table names" });
  }

  // Create a temporary database with only selected tables
  const tempDbPath = path.join(__dirname, "temp", `export_${Date.now()}.db`);
  const tempDir = path.dirname(tempDbPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempDb = new sqlite3.Database(tempDbPath, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to create export database" });
    }

    // Serialize to ensure operations happen in order
    tempDb.serialize(() => {
      // Copy schema and data for each selected table
      const copyPromises = tables.map(
        (tableName) =>
          new Promise((resolve, reject) => {
            // Get the CREATE TABLE statement
            db.get(
              `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
              [tableName],
              (err, row) => {
                if (err) {
                  reject(err);
                  return;
                }
                if (!row) {
                  reject(new Error(`Table ${tableName} not found`));
                  return;
                }

                // Create the table in temp database
                tempDb.run(row.sql, (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  // Copy data
                  db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    if (rows.length === 0) {
                      resolve();
                      return;
                    }

                    // Get column names from first row
                    const columns = Object.keys(rows[0]);
                    const placeholders = columns.map(() => "?").join(",");
                    const insertStmt = `INSERT INTO ${tableName} (${columns.join(
                      ","
                    )}) VALUES (${placeholders})`;

                    // Insert all rows
                    const insert = tempDb.prepare(insertStmt);
                    let completed = 0;
                    rows.forEach((row) => {
                      const values = columns.map((col) => row[col]);
                      insert.run(values, (err) => {
                        if (err) {
                          reject(err);
                          return;
                        }
                        completed++;
                        if (completed === rows.length) {
                          insert.finalize();
                          resolve();
                        }
                      });
                    });
                  });
                });
              }
            );
          })
      );

      Promise.all(copyPromises)
        .then(() => {
          tempDb.close((err) => {
            if (err) {
              console.error("Error closing temp database:", err);
              return res
                .status(500)
                .json({ error: "Failed to finalize export database" });
            }

            // Create a descriptive filename based on selected tables
            const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
            let filename;
            if (tables.length === 3) {
              filename = `paradash_full_${timestamp}.db`;
            } else if (tables.length === 1) {
              filename = `paradash_${tables[0]}_${timestamp}.db`;
            } else {
              filename = `paradash_export_${timestamp}.db`;
            }

            // Set headers and send the file
            res.setHeader("Content-Type", "application/x-sqlite3");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${filename}"`
            );

            const fileStream = fs.createReadStream(tempDbPath);
            fileStream.pipe(res);

            fileStream.on("end", () => {
              // Clean up temp file after download
              fs.unlink(tempDbPath, (unlinkErr) => {
                if (unlinkErr)
                  console.error("Error deleting temp file:", unlinkErr);
              });
            });

            fileStream.on("error", (err) => {
              console.error("Error streaming file:", err);
              fs.unlink(tempDbPath, () => {});
              if (!res.headersSent) {
                res.status(500).json({ error: "Failed to download database" });
              }
            });
          });
        })
        .catch((err) => {
          console.error("Error copying tables:", err);
          tempDb.close();
          fs.unlink(tempDbPath, () => {});
          res
            .status(500)
            .json({ error: "Failed to export database: " + err.message });
        });
    });
  });
});

// Legacy endpoint for backward compatibility
app.get("/api/export/database", (req, res) => {
  res.download(dbPath, "flights.db", (err) => {
    if (err) {
      res.status(500).json({ error: "Failed to export database" });
    }
  });
});

// Export table as CSV
app.get("/api/export/csv/:table", (req, res) => {
  const tableName = req.params.table;
  const allowedTables = ["flights", "gear", "gear_maintenance"];

  if (!allowedTables.includes(tableName)) {
    return res.status(400).json({ error: "Invalid table name" });
  }

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

    // Convert to CSV
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((value) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          if (
            value &&
            (value.toString().includes(",") || value.toString().includes('"'))
          ) {
            return '"' + value.toString().replace(/"/g, '""') + '"';
          }
          return value || "";
        })
        .join(",")
    );
    const csv = `${headers}\n${csvRows.join("\n")}`;

    res.header("Content-Type", "text/csv");
    res.attachment(`${tableName}.csv`);
    res.send(csv);
  });
});

// Export everything (database + IGC files) as ZIP
app.get("/api/export/full", (req, res) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const zipFilename = `paradash_backup_${timestamp}.zip`;
    
    // Set headers
    res.attachment(zipFilename);
    res.setHeader('Content-Type', 'application/zip');
    
    // Create archiver instance
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Handle errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create archive: ' + err.message });
    });
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Add database file
    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'paradash.db' });
    }
    
    // Add IGC files directory
    if (fs.existsSync(igcDir)) {
      const igcFiles = fs.readdirSync(igcDir);
      if (igcFiles.length > 0) {
        igcFiles.forEach((file) => {
          const filePath = path.join(igcDir, file);
          if (fs.statSync(filePath).isFile() && file.endsWith('.igc')) {
            archive.file(filePath, { name: `igc/${file}` });
          }
        });
      }
    }
    
    // Finalize the archive
    archive.finalize();
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data: ' + error.message });
  }
});

// ============================================================================
// API ROUTES - DATABASE IMPORT
// ============================================================================

// Import database from uploaded file
app.post("/api/import/database", uploadImport.single("database"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No database file uploaded" });
  }

  const uploadedDbPath = req.file.path;
  let importDb;

  try {
    // Open the uploaded database
    importDb = new sqlite3.Database(uploadedDbPath, (err) => {
      if (err) {
        console.error("Error opening uploaded database:", err);
        fs.unlinkSync(uploadedDbPath);
        return res.status(400).json({ error: "Invalid database file" });
      }
    });

    const imported = { flights: 0, gear: 0, maintenance: 0 };

    // Begin transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // First, clear existing data (in reverse dependency order)
      db.run("DELETE FROM flights");
      db.run("DELETE FROM gear_maintenance");
      db.run("DELETE FROM gear");

      // Import gear FIRST (since flights reference gear via foreign key)
      importDb.all("SELECT * FROM gear", [], (err, rows) => {
        if (err) {
          console.error("Error reading gear from import:", err);
        } else if (rows && rows.length > 0) {
          const stmt = db.prepare(`
            INSERT INTO gear (
              manufacturer, type, model, manufacturing_date, purchase_date,
              is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          rows.forEach((row) => {
            stmt.run(
              row.manufacturer,
              row.type,
              row.model,
              row.manufacturing_date,
              row.purchase_date,
              row.is_active,
              row.created_at,
              row.updated_at
            );
            imported.gear++;
          });

          stmt.finalize();
        }

        // Import flights SECOND (now gear exists)
        importDb.all("SELECT * FROM flights", [], (err, rows) => {
          if (err) {
            console.error("Error reading flights from import:", err);
          } else if (rows && rows.length > 0) {
            const stmt = db.prepare(`
              INSERT INTO flights (
                category, type, date, glider, flightStart, flightEnd,
                takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
                flightTime, trackDistance, straightDistance, maxAltitude,
                links, comments, igcFilePath, igcSerial, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            rows.forEach((row) => {
              stmt.run(
                row.category,
                row.type,
                row.date,
                row.glider,
                row.flightStart || row.start_time,  // Support both old and new column names
                row.flightEnd || row.end_time,
                row.takeoffLocation || row.takeoff_location,
                row.takeoffCountryCode || row.takeoff_country_code,
                row.landingLocation || row.landing_location,
                row.landingCountryCode || row.landing_country_code,
                row.flightTime || row.flight_time,
                row.trackDistance || row.track_distance,
                row.straightDistance || row.straight_distance,
                row.maxAltitude || row.max_altitude,
                row.links,
                row.comments,
                row.igcFilePath || row.igc_file,
                row.igcSerial || row.igc_serial,
                row.created_at,
                row.updated_at
              );
              imported.flights++;
            });

            stmt.finalize();
          }

          // Import gear_maintenance THIRD (references gear)
          importDb.all("SELECT * FROM gear_maintenance", [], (err, rows) => {
            if (err) {
              console.error("Error reading maintenance from import:", err);
            } else if (rows && rows.length > 0) {
              const stmt = db.prepare(`
                INSERT INTO gear_maintenance (
                  gear_id, date, category, description, attachment_path, attachment_filename, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `);

              rows.forEach((row) => {
                stmt.run(
                  row.gear_id,
                  row.date,
                  row.category,
                  row.description || row.notes,  // Support both old and new column names
                  row.attachment_path,
                  row.attachment_filename,
                  row.created_at,
                  row.updated_at
                );
                imported.maintenance++;
              });

              stmt.finalize();
            }

            // Commit transaction
            db.run("COMMIT", (err) => {
              if (err) {
                db.run("ROLLBACK");
                return res
                  .status(500)
                  .json({ error: "Failed to import database" });
              }

              // Close import database and clean up file
              importDb.close();
              fs.unlinkSync(uploadedDbPath);

              res.json({
                message: "Database imported successfully",
                imported,
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error("Import error:", error);
    if (importDb) importDb.close();
    if (fs.existsSync(uploadedDbPath)) fs.unlinkSync(uploadedDbPath);
    res.status(500).json({ error: "Failed to import database" });
  }
});

// Import full backup from ZIP file (database + IGC files)
app.post("/api/import/full", uploadImport.single("backup"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No backup file uploaded" });
  }

  const uploadedZipPath = req.file.path;
  let tempExtractDir = null;
  let importDb = null;

  try {
    // Validate it's a ZIP file
    if (path.extname(req.file.originalname).toLowerCase() !== '.zip') {
      fs.unlinkSync(uploadedZipPath);
      return res.status(400).json({ error: "Invalid file format. Please upload a ZIP backup file." });
    }

    // Create temporary extraction directory
    tempExtractDir = path.join(tempDir, `extract_${Date.now()}`);
    fs.mkdirSync(tempExtractDir, { recursive: true });

    // Extract ZIP file
    const zip = new AdmZip(uploadedZipPath);
    zip.extractAllTo(tempExtractDir, true);

    // Validate ZIP contents
    const extractedFiles = fs.readdirSync(tempExtractDir, { recursive: true });
    const dbFile = extractedFiles.find(f => f === 'paradash.db' || f.endsWith('.db'));
    
    if (!dbFile) {
      throw new Error("Invalid backup format: No database file found in ZIP");
    }

    const extractedDbPath = path.join(tempExtractDir, dbFile);
    const imported = { flights: 0, gear: 0, maintenance: 0, igcFiles: 0 };

    // Open the extracted database
    importDb = new sqlite3.Database(extractedDbPath, (err) => {
      if (err) {
        console.error("Error opening extracted database:", err);
        throw new Error("Invalid database file in backup");
      }
    });

    // Begin transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // First, clear existing data (in reverse dependency order)
      db.run("DELETE FROM flights");
      db.run("DELETE FROM gear_maintenance");
      db.run("DELETE FROM gear");

      // Delete all existing IGC files
      if (fs.existsSync(igcDir)) {
        const existingIgcFiles = fs.readdirSync(igcDir);
        existingIgcFiles.forEach((file) => {
          const filePath = path.join(igcDir, file);
          if (fs.statSync(filePath).isFile() && file.endsWith('.igc')) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Import gear FIRST (since flights reference gear via foreign key)
      importDb.all("SELECT * FROM gear", [], (err, rows) => {
        if (err) {
          console.error("Error reading gear from import:", err);
        } else if (rows && rows.length > 0) {
          const stmt = db.prepare(`
            INSERT INTO gear (
              manufacturer, type, model, manufacturing_date, purchase_date,
              is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          rows.forEach((row) => {
            stmt.run(
              row.manufacturer,
              row.type,
              row.model,
              row.manufacturing_date,
              row.purchase_date,
              row.is_active,
              row.created_at,
              row.updated_at
            );
            imported.gear++;
          });

          stmt.finalize();
        }

        // Import flights SECOND (now gear exists)
        importDb.all("SELECT * FROM flights", [], (err, rows) => {
          if (err) {
            console.error("Error reading flights from import:", err);
          } else if (rows && rows.length > 0) {
            const stmt = db.prepare(`
              INSERT INTO flights (
                category, type, date, glider, flightStart, flightEnd,
                takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
                flightTime, trackDistance, straightDistance, maxAltitude,
                links, comments, igcFilePath, igcSerial, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            rows.forEach((row) => {
              stmt.run(
                row.category,
                row.type,
                row.date,
                row.glider,
                row.flightStart || row.start_time,
                row.flightEnd || row.end_time,
                row.takeoffLocation || row.takeoff_location,
                row.takeoffCountryCode || row.takeoff_country_code,
                row.landingLocation || row.landing_location,
                row.landingCountryCode || row.landing_country_code,
                row.flightTime || row.flight_time,
                row.trackDistance || row.track_distance,
                row.straightDistance || row.straight_distance,
                row.maxAltitude || row.max_altitude,
                row.links,
                row.comments,
                row.igcFilePath || row.igc_file,
                row.igcSerial || row.igc_serial,
                row.created_at,
                row.updated_at
              );
              imported.flights++;
            });

            stmt.finalize();
          }

          // Import gear_maintenance THIRD (references gear)
          importDb.all("SELECT * FROM gear_maintenance", [], (err, rows) => {
            if (err) {
              console.error("Error reading maintenance from import:", err);
            } else if (rows && rows.length > 0) {
              const stmt = db.prepare(`
                INSERT INTO gear_maintenance (
                  gear_id, date, category, description, attachment_path, attachment_filename, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `);

              rows.forEach((row) => {
                stmt.run(
                  row.gear_id,
                  row.date,
                  row.category,
                  row.description || row.notes,
                  row.attachment_path,
                  row.attachment_filename,
                  row.created_at,
                  row.updated_at
                );
                imported.maintenance++;
              });

              stmt.finalize();
            }

            // Import IGC files
            const igcExtractDir = path.join(tempExtractDir, 'igc');
            if (fs.existsSync(igcExtractDir)) {
              const igcFiles = fs.readdirSync(igcExtractDir);
              igcFiles.forEach((file) => {
                if (file.endsWith('.igc')) {
                  const sourcePath = path.join(igcExtractDir, file);
                  const destPath = path.join(igcDir, file);
                  fs.copyFileSync(sourcePath, destPath);
                  imported.igcFiles++;
                }
              });
            }

            // Commit transaction
            db.run("COMMIT", (err) => {
              if (err) {
                db.run("ROLLBACK");
                return res
                  .status(500)
                  .json({ error: "Failed to import backup" });
              }

              // Close import database and clean up
              if (importDb) importDb.close();
              if (fs.existsSync(uploadedZipPath)) fs.unlinkSync(uploadedZipPath);
              if (tempExtractDir && fs.existsSync(tempExtractDir)) {
                fs.rmSync(tempExtractDir, { recursive: true, force: true });
              }

              console.log(`Full backup imported: ${imported.flights} flights, ${imported.gear} gear, ${imported.maintenance} maintenance, ${imported.igcFiles} IGC files`);
              res.json({
                message: "Backup imported successfully",
                imported,
              });
            });
          });
        });
      });
    });

  } catch (error) {
    console.error("Import error:", error);
    if (importDb) importDb.close();
    if (fs.existsSync(uploadedZipPath)) fs.unlinkSync(uploadedZipPath);
    if (tempExtractDir && fs.existsSync(tempExtractDir)) {
      try {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Error cleaning up temp directory:", cleanupError);
      }
    }
    res.status(500).json({ 
      error: error.message || "Failed to import backup" 
    });
  }
});

// Import table from CSV
app.post("/api/import/csv/:table", uploadImport.single("csv"), (req, res) => {
  const tableName = req.params.table;
  const allowedTables = ["flights", "gear", "gear_maintenance"];

  if (!allowedTables.includes(tableName)) {
    return res.status(400).json({ error: "Invalid table name" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  const csvFilePath = req.file.path;

  try {
    const csvContent = fs.readFileSync(csvFilePath, "utf8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      fs.unlinkSync(csvFilePath);
      return res.status(400).json({ error: "CSV file is empty or invalid" });
    }

    // Parse CSV header
    const headers = lines[0].split(",").map((h) => h.trim());

    // Parse CSV rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let currentValue = "";
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        rows.push(row);
      }
    }

    // Begin transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Clear existing data in table
      db.run(`DELETE FROM ${tableName}`);

      let imported = 0;

      // Prepare insert statement based on table
      let insertQuery, getValues;

      if (tableName === "flights") {
        insertQuery = `
          INSERT INTO flights (
            date, start_time, end_time, flight_time, takeoff_location,
            landing_location, max_altitude, track_distance, category, type,
            manufacturer, model, glider, comments, igc_file, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        getValues = (row) => [
          row.date,
          row.start_time,
          row.end_time,
          row.flight_time,
          row.takeoff_location,
          row.landing_location,
          row.max_altitude,
          row.track_distance,
          row.category,
          row.type,
          row.manufacturer,
          row.model,
          row.glider,
          row.comments,
          row.igc_file,
          row.created_at,
          row.updated_at,
        ];
      } else if (tableName === "gear") {
        insertQuery = `
          INSERT INTO gear (
            manufacturer, type, model, manufacturing_date, purchase_date,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        getValues = (row) => [
          row.manufacturer,
          row.type,
          row.model,
          row.manufacturing_date,
          row.purchase_date,
          row.is_active,
          row.created_at,
          row.updated_at,
        ];
      } else if (tableName === "gear_maintenance") {
        insertQuery = `
          INSERT INTO gear_maintenance (
            gear_id, date, category, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        getValues = (row) => [
          row.gear_id,
          row.date,
          row.category,
          row.notes,
          row.created_at,
          row.updated_at,
        ];
      }

      const stmt = db.prepare(insertQuery);

      rows.forEach((row) => {
        stmt.run(getValues(row));
        imported++;
      });

      stmt.finalize((err) => {
        if (err) {
          db.run("ROLLBACK");
          fs.unlinkSync(csvFilePath);
          return res.status(500).json({ error: "Failed to import CSV" });
        }

        db.run("COMMIT", (err) => {
          if (err) {
            db.run("ROLLBACK");
            fs.unlinkSync(csvFilePath);
            return res.status(500).json({ error: "Failed to import CSV" });
          }

          fs.unlinkSync(csvFilePath);
          res.json({
            message: `${tableName} imported successfully`,
            imported,
          });
        });
      });
    });
  } catch (error) {
    console.error("CSV import error:", error);
    if (fs.existsSync(csvFilePath)) fs.unlinkSync(csvFilePath);
    res.status(500).json({ error: "Failed to import CSV: " + error.message });
  }
});

// Wipe all database data
app.post("/api/database/wipe", (req, res) => {
  try {
    const deleted = { flights: 0, gear: 0, maintenance: 0 };

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Count records before deletion
      db.get("SELECT COUNT(*) as count FROM flights", [], (err, row) => {
        if (!err) deleted.flights = row.count;
      });

      db.get("SELECT COUNT(*) as count FROM gear", [], (err, row) => {
        if (!err) deleted.gear = row.count;
      });

      db.get(
        "SELECT COUNT(*) as count FROM gear_maintenance",
        [],
        (err, row) => {
          if (!err) deleted.maintenance = row.count;
        }
      );

      // Delete all data
      db.run("DELETE FROM flights", (err) => {
        if (err) {
          console.error("Error deleting flights:", err);
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Failed to delete flights" });
        }

        db.run("DELETE FROM gear_maintenance", (err) => {
          if (err) {
            console.error("Error deleting maintenance:", err);
            db.run("ROLLBACK");
            return res
              .status(500)
              .json({ error: "Failed to delete maintenance" });
          }

          db.run("DELETE FROM gear", (err) => {
            if (err) {
              console.error("Error deleting gear:", err);
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Failed to delete gear" });
            }

            // Reset autoincrement counters
            db.run(
              "DELETE FROM sqlite_sequence WHERE name IN ('flights', 'gear', 'gear_maintenance')",
              (err) => {
                if (err) {
                  console.error("Error resetting sequences:", err);
                }

                db.run("COMMIT", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return res
                      .status(500)
                      .json({ error: "Failed to commit wipe" });
                  }

                  // Delete all IGC files
                  let deletedIgcFiles = 0;
                  try {
                    if (fs.existsSync(igcDir)) {
                      const files = fs.readdirSync(igcDir);
                      files.forEach((file) => {
                        const filePath = path.join(igcDir, file);
                        if (fs.statSync(filePath).isFile() && file.endsWith('.igc')) {
                          fs.unlinkSync(filePath);
                          deletedIgcFiles++;
                        }
                      });
                      console.log(`Deleted ${deletedIgcFiles} IGC files`);
                    }
                  } catch (igcError) {
                    console.error("Error deleting IGC files:", igcError);
                    // Continue even if IGC deletion fails
                  }

                  console.log(
                    `Database wiped: ${deleted.flights} flights, ${deleted.gear} gear, ${deleted.maintenance} maintenance, ${deletedIgcFiles} IGC files`
                  );
                  res.json({
                    message: "Database wiped successfully",
                    deleted: {
                      ...deleted,
                      igcFiles: deletedIgcFiles,
                    },
                  });
                });
              }
            );
          });
        });
      });
    });
  } catch (error) {
    console.error("Database wipe error:", error);
    res
      .status(500)
      .json({ error: "Failed to wipe database: " + error.message });
  }
});

// ============================================================================
// IGC FILE PROCESSING FUNCTIONS
// ============================================================================

// Function to parse IGC file and extract flight data
function parseIGCFile(filePath) {
  try {
    const igcContent = fs.readFileSync(filePath, "utf8");
    const flight = IGCParser.parse(igcContent);

    if (!flight || !flight.fixes || flight.fixes.length === 0) {
      throw new Error("Invalid IGC file or no GPS fixes found");
    }

    // Extract start and end times
    const firstFix = flight.fixes[0];
    const lastFix = flight.fixes[flight.fixes.length - 1];

    // Handle different time formats from IGC parser
    let startTime, endTime, flightDate;

    if (firstFix.timestamp) {
      // If timestamp is available
      const startDate = new Date(firstFix.timestamp);
      const endDate = new Date(lastFix.timestamp);

      // Use local time instead of UTC
      startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(
        startDate.getMinutes()
      ).padStart(2, "0")}`;
      endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(
        endDate.getMinutes()
      ).padStart(2, "0")}`;
      flightDate = startDate.toISOString().split("T")[0];

      // Calculate duration
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      const duration = `${String(durationHours).padStart(2, "0")}:${String(
        durationMinutes
      ).padStart(2, "0")}`;

      return {
        startTime,
        endTime,
        duration,
        date: flightDate,
        pilotName: flight.pilot || "",
        gliderType: flight.gliderType || "",
        gliderSerial: flight.gliderSerial || "",
        totalFixes: flight.fixes.length,
        valid: true,
      };
    } else if (firstFix.time) {
      // Handle time object format
      const timeToString = (timeObj) => {
        const hours = timeObj.hours || timeObj.hour || 0;
        const minutes = timeObj.minutes || timeObj.minute || 0;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}`;
      };

      startTime = timeToString(firstFix.time);
      endTime = timeToString(lastFix.time);

      // Calculate duration from time difference
      const startMinutes =
        (firstFix.time.hours || 0) * 60 + (firstFix.time.minutes || 0);
      const endMinutes =
        (lastFix.time.hours || 0) * 60 + (lastFix.time.minutes || 0);
      const durationTotalMinutes = Math.max(0, endMinutes - startMinutes);
      const durationHours = Math.floor(durationTotalMinutes / 60);
      const durationMins = durationTotalMinutes % 60;
      const duration = `${String(durationHours).padStart(2, "0")}:${String(
        durationMins
      ).padStart(2, "0")}`;

      // Try to extract date from flight header or use today
      flightDate = flight.date || new Date().toISOString().split("T")[0];

      return {
        startTime,
        endTime,
        duration,
        date: flightDate,
        pilotName: flight.pilot || "",
        gliderType: flight.gliderType || "",
        gliderSerial: flight.gliderSerial || "",
        totalFixes: flight.fixes.length,
        valid: true,
      };
    } else {
      throw new Error("Unable to parse time information from IGC file");
    }
  } catch (error) {
    console.error("Error parsing IGC file:", error);
    throw new Error(`Failed to parse IGC file: ${error.message}`);
  }
}

// Function to check if IGC file already exists
function checkIGCExists(originalFilename, gliderSerial, date) {
  const files = fs.readdirSync(igcDir);

  // Check for exact filename match since we now keep original filenames
  const existingFiles = files.filter((file) => {
    return file === originalFilename;
  });

  return existingFiles.length > 0 ? existingFiles : null;
}

// Check if IGC data already exists in the database
function checkIGCDuplicate(originalFilename, igcData) {
  return new Promise((resolve, reject) => {
    // Check for exact match based on date, takeoff time, duration, AND glider serial
    // This is more precise than just date/time which could match different flights
    db.get(
      `
      SELECT id, date, flightStart, flightTime, takeoffLocation, landingLocation, igcFilePath, igcSerial, created_at
      FROM flights 
      WHERE date = ? 
        AND flightStart = ? 
        AND flightTime = ?
        AND igcSerial = ?
        AND igcFilePath IS NOT NULL 
        AND igcFilePath != ''
        AND igcFilePath = ?
      LIMIT 1
    `,
      [
        igcData.date,
        igcData.startTime,
        igcData.duration,
        igcData.gliderSerial,
        originalFilename,
      ],
      (err, row) => {
        if (err) {
          console.error("Error checking for IGC duplicates:", err);
          resolve({ isDuplicate: false, existingFlight: null });
        } else if (row) {
          console.log(
            `Duplicate detected: Found existing flight ${row.id} with same IGC file`
          );
          resolve({ isDuplicate: true, existingFlight: row });
        } else {
          console.log(`No duplicate found - this appears to be a new flight`);
          resolve({ isDuplicate: false, existingFlight: null });
        }
      }
    );
  });
}

// ============================================================================
// IGC UPLOAD API ENDPOINTS
// ============================================================================

// Upload IGC file and parse it
app.post("/api/igc/upload", upload.single("igcFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No IGC file uploaded" });
    }

    const tempFilePath = req.file.path;
    const originalName = req.file.originalname;

    console.log(`Processing IGC file: ${originalName}`);

    // Parse the IGC file from temp location
    const igcData = parseIGCFile(tempFilePath);

    // Check for existing IGC file with same date and start time that is also referenced in the database
    const files = fs.readdirSync(igcDir);
    let duplicateFile = null;
    for (const file of files) {
      try {
        const otherIgcData = parseIGCFile(path.join(igcDir, file));
        if (
          otherIgcData.date === igcData.date &&
          otherIgcData.startTime === igcData.startTime
        ) {
          // Check if this file is actually referenced in the database
          const dbCheck = await new Promise((resolve) => {
            db.get(
              "SELECT id FROM flights WHERE igcFilePath = ?",
              [file],
              (err, row) => {
                resolve(row ? true : false);
              }
            );
          });

          if (dbCheck) {
            duplicateFile = file;
            break;
          } else {
            // File exists but not in database - it's orphaned, we can ignore it
            console.log(
              `Found orphaned IGC file: ${file}, ignoring for duplicate check`
            );
          }
        }
      } catch (e) {
        // Ignore parse errors for other files
      }
    }

    if (duplicateFile) {
      // Delete the temp file since it's a duplicate
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(409).json({
        error: "Similar IGC file already exists",
        message: `An IGC file with the same date and start time already exists: ${duplicateFile}`,
      });
    }

    // Check if this exact IGC file data already exists in the database
    const duplicateCheck = await checkIGCDuplicate(originalName, igcData);

    if (duplicateCheck.isDuplicate) {
      // Delete the temp file since it's a duplicate
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      return res.status(409).json({
        error: "Duplicate IGC file detected",
        message: `This IGC file has already been uploaded. Found existing flight from ${duplicateCheck.existingFlight.date} with the same data.`,
        duplicateDetails: duplicateCheck.existingFlight,
      });
    }

    // No duplicates found, move file to permanent location
    const finalPath = path.join(igcDir, originalName);
    fs.renameSync(tempFilePath, finalPath);

    res.json({
      success: true,
      message: "IGC file uploaded and parsed successfully",
      filePath: originalName, // Store relative filename, not full path
      originalName: originalName,
      igcData: igcData,
      existingFiles: [],
      fileExists: false,
    });
  } catch (error) {
    // Delete the temp file if parsing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("IGC upload error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Download IGC file
app.get("/api/igc/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(igcDir, filename);

    if (fs.existsSync(filePath)) {
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Error downloading IGC file:", err);
          res.status(500).json({ error: "Failed to download IGC file" });
        }
      });
    } else {
      res.status(404).json({ error: "IGC file not found" });
    }
  } catch (error) {
    console.error("Error downloading IGC file:", error);
    res.status(500).json({ error: "Failed to download IGC file" });
  }
});

// Get IGC track data for mapping
app.get("/api/igc/track/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(igcDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "IGC file not found" });
    }

    const igcContent = fs.readFileSync(filePath, "utf8");
    const flight = IGCParser.parse(igcContent);

    if (!flight || !flight.fixes || flight.fixes.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid IGC file or no GPS fixes found" });
    }

    // Extract track points with coordinates and altitude
    const trackPoints = flight.fixes.map((fix) => ({
      latitude: fix.latitude,
      longitude: fix.longitude,
      altitude: fix.pressureAltitude || fix.gpsAltitude || 0,
      timestamp: fix.timestamp,
    }));

    // Calculate bounds for map centering
    const latitudes = trackPoints.map((point) => point.latitude);
    const longitudes = trackPoints.map((point) => point.longitude);
    const altitudes = trackPoints.map((point) => point.altitude);

    const bounds = {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
      maxAltitude: Math.max(...altitudes),
      minAltitude: Math.min(...altitudes),
    };

    // Calculate center point
    const center = {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2,
    };

    res.json({
      trackPoints,
      bounds,
      center,
      totalPoints: trackPoints.length,
      flightInfo: {
        pilot: flight.pilot || "",
        gliderType: flight.gliderType || "",
        gliderSerial: flight.gliderSerial || "",
      },
    });
  } catch (error) {
    console.error("Error parsing IGC track:", error);
    res.status(500).json({ error: "Failed to parse IGC track data" });
  }
});

// Delete IGC file
app.delete("/api/igc/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(igcDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: "IGC file deleted successfully" });
    } else {
      res.status(404).json({ error: "IGC file not found" });
    }
  } catch (error) {
    console.error("Error deleting IGC file:", error);
    res.status(500).json({ error: "Failed to delete IGC file" });
  }
});

// Replace existing IGC file
app.post("/api/igc/replace/:filename", upload.single("igcFile"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No IGC file uploaded" });
    }

    const oldFilename = req.params.filename;
    const oldFilePath = path.join(igcDir, oldFilename);

    // Delete old file if it exists
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    // Parse the new IGC file
    const igcData = parseIGCFile(req.file.path);

    res.json({
      success: true,
      message: "IGC file replaced successfully",
      filePath: req.file.filename,
      originalName: req.file.originalname,
      igcData: igcData,
      replacedFile: oldFilename,
    });
  } catch (error) {
    // Delete the uploaded file if parsing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("IGC replace error:", error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 paraDash API Server running on port ${PORT}`);
  console.log(`📊 API Endpoints available at: http://localhost:${PORT}/api/`);
  console.log(`   - GET  /api/flights - Get all flights`);
  console.log(`   - POST /api/flights - Add new flight`);
  console.log(`   - GET  /api/gear - Get all gear`);
  console.log(`   - GET  /api/export/database - Export database file`);
  console.log(`   - GET  /api/export/csv/flights - Export flights as CSV`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err);
    } else {
      console.log("✅ Database connection closed.");
    }
    process.exit(0);
  });
});
