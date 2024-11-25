const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS paragliding (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            type TEXT,
            date TEXT,
            glider TEXT,
            takeoff_location TEXT,
            landing_location TEXT,
            flight_time TEXT,
            links TEXT,
            comments TEXT,
            igc_file_path TEXT
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

// GEAR DATABASE
app.get('/gear', (req, res) => {
    db.all('SELECT * FROM gear', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/gear', (req, res) => {
    const { gear_type, brand, model, manufacturing_date, purchase_date, total_flight_time, number_of_flights } = req.body;
    db.run(
        'INSERT INTO gear (gear_type, brand, model, manufacturing_date, purchase_date, total_flight_time, number_of_flights) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [gear_type, brand, model, manufacturing_date, purchase_date, total_flight_time, number_of_flights],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/gear/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM gear WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Glider deleted', changes: this.changes });
    });
});

app.put('/gear/:id', (req, res) => {
    const { id } = req.params;
    const { gear_type, brand, model, manufacturing_date, purchase_date, total_flight_time, number_of_flights } = req.body;
    db.run(
        'UPDATE gear SET gear_type = ?, brand = ?, model = ?, manufacturing_date = ?, purchase_date = ?, total_flight_time = ?, number_of_flights = ? WHERE id = ?',
        [gear_type, brand, model, manufacturing_date, purchase_date, total_flight_time, number_of_flights, id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: 'Gear updated', changes: this.changes });
        }
    );
});

// MAINTENANCE DATABASE 
app.get('/maintenance', (req, res) => {
    db.all('SELECT * FROM maintenance', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/maintenance', (req, res) => {
    const { gear_id, maintenance_date, maintenance_type, by_whom, description } = req.body;
    db.run(
        'INSERT INTO maintenance (gear_id, maintenance_date, maintenance_type, by_whom, description) VALUES (?, ?, ?, ?, ?)',
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

app.put('/maintenance/:id', (req, res) => {
    const { id } = req.params;
    const { gear_id, maintenance_date, maintenance_type, by_whom, description } = req.body;
    db.run(
        'UPDATE maintenance SET gear_id = ?, maintenance_date = ?, maintenance_type = ?, by_whom = ?, description = ?, WHERE id = ?',
        [gear_id, maintenance_date, maintenance_type, by_whom, description, id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: 'Maintenance record updated', changes: this.changes });
        }
    );
});

app.delete('/maintenance/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM maintenance WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Maintenance record deleted', changes: this.changes });
    });
});



// Get all items
app.get('/items', (req, res) => {
    db.all('SELECT * FROM paragliding', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Add a new item
app.post('/items', (req, res) => {
    const { category, type, date, glider, takeoff_location, landing_location, flight_time, links, comments, igc_file_path } = req.body;
    db.run(
        'INSERT INTO paragliding (category, type, date, glider, takeoff_location, landing_location, flight_time, links, comments, igc_file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [category, type, date, glider, takeoff_location, landing_location, flight_time, links, comments, igc_file_path],
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
app.delete('/items', (req, res) => {
    db.run('DELETE FROM paragliding', [], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'All items deleted' });
    });
});

// FILE MANAGEMENT
const uploadDir = path.join(__dirname, 'uploads/igc');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/igc'); // Folder to save the uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Save the file with its original name
    },
});

const upload = multer({ storage: storage });

// Endpoint to handle file upload
app.post('/uploads/igc', upload.single('igcFile'), (req, res) => {
    res.send('File uploaded successfully');
});

// The rest should be sorted later
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});