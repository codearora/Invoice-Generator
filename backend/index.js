const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, qty INTEGER, rate REAL)");
    db.run("CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY, user_id INTEGER, date TEXT, products TEXT)");
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, 'secret');
        req.user = decoded.id;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (user) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], function (err) {
            if (err) {
                console.error('Database Error:', err);
                return res.status(400).json({ message: 'Error inserting user' });
            }
            res.json({ id: this.lastID });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user) return res.status(400).json({ message: 'User not found' });
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: 3600 });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

app.post('/add-product', authenticateToken, (req, res) => {
    const { name, qty, rate } = req.body;
    db.run("INSERT INTO products (name, qty, rate) VALUES (?, ?, ?)", [name, qty, rate], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Error adding product' });
        }
        res.json({ id: this.lastID });
    });
});

app.get('/products', authenticateToken, (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/generate-invoice', authenticateToken, (req, res) => {
    const { products } = req.body;
    console.log('Received products for invoice:', products); // Debugging
    const userId = req.user;
    const date = new Date().toISOString();
    db.run("INSERT INTO invoices (user_id, date, products) VALUES (?, ?, ?)", [userId, date, JSON.stringify(products)], async function (err) {
        if (err) {
            return res.status(400).json({ message: 'Error generating invoice' });
        }
        const invoiceId = this.lastID;
        const pdf = await generatePDF({ id: invoiceId, user_id: userId, date, products });
        res.setHeader('Content-disposition', 'attachment; filename=invoice.pdf');
        res.setHeader('Content-type', 'application/pdf');
        res.send(pdf);
    });
});

async function generatePDF(invoice) {
    console.log('Generating PDF with invoice data:', invoice); // Debugging
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Get current date in IST
    const dateIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    const content = `
    <html>
    <head>
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <h1 style="text-align: center;">Invoice #${invoice.id}</h1>
        <p style="text-align: right;">Date: ${dateIST}</p>
        <table>
            <thead>
                <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.products.map(product => `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.qty}</td>
                        <td>${product.rate}</td>
                        <td>${product.qty * product.rate}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
  `;
    await page.setContent(content);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdf;
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
