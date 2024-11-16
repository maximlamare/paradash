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
        db.run(`CREATE TABLE IF NOT EXISTS gliders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT,
            model TEXT,
            purchase_date TEXT,
            logo_path TEXT,
            total_flight_time INTEGER,
            number_of_flights INTEGER
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS harnesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT,
            model TEXT,
            purchase_date TEXT,
            logo_path TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS rescue_parachutes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT,
            model TEXT,
            purchase_date TEXT,
            logo_path TEXT
        )`);
    }
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

// CRUD operations for gliders
app.get('/gliders', (req, res) => {
    db.all('SELECT * FROM gliders', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/gliders', (req, res) => {
    const { brand, model, purchase_date, logo_path, total_flight_time, number_of_flights } = req.body;
    db.run(
        'INSERT INTO gliders (brand, model, purchase_date, logo_path, total_flight_time, number_of_flights) VALUES (?, ?, ?, ?, ?, ?)',
        [brand, model, purchase_date, logo_path, total_flight_time, number_of_flights],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/gliders/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM gliders WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Glider deleted', changes: this.changes });
    });
});


// CRUD operations for harnesses
app.get('/harnesses', (req, res) => {
    db.all('SELECT * FROM harnesses', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/harnesses', (req, res) => {
    const { brand, model, purchase_date, logo_path } = req.body;
    db.run(
        'INSERT INTO harnesses (brand, model, purchase_date, logo_path) VALUES (?, ?, ?, ?)',
        [brand, model, purchase_date, logo_path],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

// Update a glider by ID
app.put('/gliders/:id', (req, res) => {
    const { id } = req.params;
    const { brand, model, purchase_date, logo_path, total_flight_time, number_of_flights } = req.body;
    db.run(
        'UPDATE gliders SET brand = ?, model = ?, purchase_date = ?, logo_path = ?, total_flight_time = ?, number_of_flights = ? WHERE id = ?',
        [brand, model, purchase_date, logo_path, total_flight_time, number_of_flights, id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: 'Glider updated', changes: this.changes });
        }
    );
});

// CRUD operations for rescue parachutes
app.get('/rescue_parachutes', (req, res) => {
    db.all('SELECT * FROM rescue_parachutes', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/rescue_parachutes', (req, res) => {
    const { brand, model, purchase_date, logo_path } = req.body;
    db.run(
        'INSERT INTO rescue_parachutes (brand, model, purchase_date, logo_path) VALUES (?, ?, ?, ?)',
        [brand, model, purchase_date, logo_path],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});