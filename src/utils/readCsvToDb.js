const fs = require("fs");
const csv = require("csv-parser"); // npm install csv-parser
const sqlite3 = require("sqlite3").verbose(); // npm install sqlite3

// Path to your CSV file and database
const csvFilePath = "/Users/mlamare/repos/paradash/backend/launchSites.csv";
const dbFilePath = "/Users/mlamare/repos/paradash/backend/launch_sites.db";

// Connect to the SQLite database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    return;
  }
  console.log("Connected to the SQLite database.");
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error("Error fetching tables:", err.message);
      return;
    }
    console.log("Tables in the database:");
    tables.forEach((table) => {
      console.log(table.name);
    });
  });

  // Read the CSV file and insert data into the database
  const results = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => {
      db.serialize(() => {
        // Create table if it doesn't exist
        db.run(`
        CREATE TABLE IF NOT EXISTS launch_sites (
          name TEXT,
          url TEXT,
          longitude FLOAT,
          latitude FLOAT,
          country TEXT
        )
      `);

        // Insert data into the table
        const stmt = db.prepare(
          "INSERT INTO launch_sites (name, url, longitude, latitude, country) VALUES (?, ?, ?, ?, ?)"
        );
        for (const row of results) {
          stmt.run(
            row.Name,
            row.URL,
            parseFloat(row.Longitude),
            parseFloat(row.Latitude),
            row.Country
          );
        }
        stmt.finalize();

        console.log("Data successfully imported to the database.");
        db.each("SELECT * FROM launch_sites", (err, row) => {
          if (err) {
            console.error("Error fetching data:", err.message);
            return;
          }
          console.log(row);
        });
      });

      // Close the database connection
      db.close((err) => {
        if (err) {
          console.error("Error closing the database connection:", err.message);
          return;
        }
        console.log("Closed the database connection.");
      });
    })
    .on("error", (error) => {
      console.error("Error reading CSV file:", error.message);
    });
});
