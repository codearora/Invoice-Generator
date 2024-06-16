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

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, qty INTEGER, rate REAL)");
    db.run("CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY, user_id INTEGER, date TEXT, products TEXT)");
});

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

app.put('/update-product/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, qty, rate } = req.body;
    db.run("UPDATE products SET name = ?, qty = ?, rate = ? WHERE id = ?", [name, qty, rate, id], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Error updating product' });
        }
        res.json({ message: 'Product updated' });
    });
});

app.delete('/delete-product/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Error deleting product' });
        }
        res.json({ message: 'Product deleted' });
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
    const userId = req.user;
    const date = new Date().toISOString();

    db.get("SELECT name, email FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ message: 'Error fetching user details' });
        }

        db.run("INSERT INTO invoices (user_id, date, products) VALUES (?, ?, ?)", [userId, date, JSON.stringify(products)], async function (err) {
            if (err) {
                return res.status(400).json({ message: 'Error generating invoice' });
            }
            const invoiceId = this.lastID;
            const pdf = await generatePDF({ id: invoiceId, user_id: userId, date, products, user });
            res.setHeader('Content-disposition', 'attachment; filename=invoice.pdf');
            res.setHeader('Content-type', 'application/pdf');
            res.send(pdf);
        });
    });
});

async function generatePDF(invoice) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); background-color: #f9f9f9; }
            .invoice-box h2 { margin-top: 0; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .invoice-header div { font-size: 14px; }
            .invoice-header .title { font-size: 18px; font-weight: bold; }
            .invoice-table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .invoice-table th, .invoice-table td { padding: 12px; border: 1px solid #ddd; }
            .invoice-table th { background-color: #f2f2f2; font-weight: bold; }
            .invoice-footer { margin-top: 20px; }
            .invoice-footer .totals { text-align: right; }
            .invoice-footer .totals div { margin-bottom: 10px; }
            .signature { margin-top: 40px; text-align: right; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="invoice-header">
                <div class="title">Soft Factory</div>
                <div>
                    <div>Invoice #: ${invoice.id}</div>
                    <div>Date: ${new Date(invoice.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                    <div>Owner: ${invoice.user.name}</div>
                    <div>Email: ${invoice.user.email}</div>
                </div>
            </div>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Product</th>
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
                            <td>$${product.rate.toFixed(2)}</td>
                            <td>$${(product.qty * product.rate).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="invoice-footer">
                <div class="totals">
                    <div>Subtotal: $${invoice.products.reduce((sum, product) => sum + (product.qty * product.rate), 0).toFixed(2)}</div>
                    <div>GST (18%): $${(invoice.products.reduce((sum, product) => sum + (product.qty * product.rate), 0) * 0.18).toFixed(2)}</div>
                    <div><strong>Total: $${(invoice.products.reduce((sum, product) => sum + (product.qty * product.rate), 0) * 1.18).toFixed(2)}</strong></div>
                </div>
                <div class="signature">
                    Signature<br>
                    Soft Industries
                </div>
            </div>
        </div>
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
