const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'orphanage_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB Connection
pool.getConnection()
    .then(conn => {
        console.log('Connected to MySQL Database: ' + process.env.DB_NAME);
        conn.release();
    })
    .catch(err => console.error('Error connecting to MySQL:', err.message));

// --- API ENDPOINTS ---

// 1. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [[childrenCount]] = await pool.query('SELECT COUNT(*) as count FROM Children');
        const [[donationsTotal]] = await pool.query('SELECT SUM(Amount) as total FROM Donation');
        const [[resourcesTotal]] = await pool.query('SELECT SUM(Total_Quantity) as total FROM Resource');
        const [[allocationsToday]] = await pool.query('SELECT COUNT(*) as count FROM Allocation WHERE Allocation_Date = CURDATE()');

        res.json({
            totalChildren: childrenCount.count || 0,
            totalDonations: donationsTotal.total || 0,
            resourcesAvailable: resourcesTotal.total || 0,
            allocationsToday: allocationsToday.count || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching stats' });
    }
});

// 2. Recent Donations
app.get('/api/donations/recent', async (req, res) => {
    try {
        const query = `
            SELECT d.Name as donor, do.Amount as amount, DATE_FORMAT(do.Donation_Date, '%Y-%m-%d') as date, 'Completed' as status 
            FROM Donation do 
            JOIN Donor d ON do.Donor_ID = d.Donor_ID 
            ORDER BY do.Donation_Date DESC 
            LIMIT 5
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching recent donations' });
    }
});

// 3. Low Resources Alert
app.get('/api/resources/low', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT Resource_ID as id, Resource_Type as type, Total_Quantity as qty FROM Resource WHERE Total_Quantity < 100');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching low resources' });
    }
});

// 4. Get All Children
app.get('/api/children', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT Child_ID as id, Name as name, DATE_FORMAT(DOB, "%Y-%m-%d") as dob, Gender as gender, Medical_Record as medical FROM Children');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching children' });
    }
});

// 5. Get All Resources
app.get('/api/resources', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT Resource_ID as id, Resource_Type as type, Total_Quantity as qty FROM Resource');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching resources' });
    }
});

// 6. Get All Staff
app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT Staff_ID as id, Name as name, Role as role, Contact as contact FROM Staff');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching staff' });
    }
});

// 7. Get All Donors
app.get('/api/donors', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT Donor_ID as id, Name as name, Contact as contact, Email as email FROM Donor');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching donors' });
    }
});

// 8. Get All Donations (Full History)
app.get('/api/donations', async (req, res) => {
    try {
        const query = `
            SELECT do.Donation_ID as id, d.Name as donor, do.Amount as amount, DATE_FORMAT(do.Donation_Date, '%Y-%m-%d') as date 
            FROM Donation do 
            JOIN Donor d ON do.Donor_ID = d.Donor_ID 
            ORDER BY do.Donation_Date DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching donations' });
    }
});

// 9. Get All Allocations
app.get('/api/allocations', async (req, res) => {
    try {
        const query = `
            SELECT a.Allocation_ID as id, c.Name as child, r.Resource_Type as resource, a.Quantity as qty, DATE_FORMAT(a.Allocation_Date, '%Y-%m-%d') as date, s.Name as staff 
            FROM Allocation a 
            JOIN Children c ON a.Child_ID = c.Child_ID 
            JOIN Resource r ON a.Resource_ID = r.Resource_ID
            JOIN Staff s ON a.Staff_ID = s.Staff_ID
            ORDER BY a.Allocation_Date DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching allocations' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
