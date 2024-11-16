const express = require('express');
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


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
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