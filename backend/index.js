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

// app.post('/generate-invoice', authenticateToken, (req, res) => {
//     const { products } = req.body;
//     console.log('Received products for invoice:', products); // Debugging
//     const userId = req.user;
//     const date = new Date().toISOString();
//     db.run("INSERT INTO invoices (user_id, date, products) VALUES (?, ?, ?)", [userId, date, JSON.stringify(products)], async function (err) {
//         if (err) {
//             return res.status(400).json({ message: 'Error generating invoice' });
//         }
//         const invoiceId = this.lastID;
//         const pdf = await generatePDF({ id: invoiceId, user_id: userId, date, products });
//         res.setHeader('Content-disposition', 'attachment; filename=invoice.pdf');
//         res.setHeader('Content-type', 'application/pdf');
//         res.send(pdf);
//     });
// });

// Add this route in your server.js (or index.js)
app.delete('/delete-product/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Error deleting product' });
        }
        res.json({ message: 'Product deleted successfully' });
    });
});

// Add this route in your server.js (or index.js)
app.put('/update-product/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, qty, rate } = req.body;
    db.run("UPDATE products SET name = ?, qty = ?, rate = ? WHERE id = ?", [name, qty, rate, id], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Error updating product' });
        }
        res.json({ message: 'Product updated successfully' });
    });
});


// src/server.js (or your main server file)
app.post('/generate-invoice', authenticateToken, (req, res) => {
    const { products } = req.body;
    console.log('Received products for invoice:', products); // Add this line for debugging
    const userId = req.user;
    const date = new Date().toISOString();

    // Fetch the user details
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
    console.log('Generating PDF with invoice data:', invoice); // Add this line for debugging
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
            .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
            .invoice-box table td { padding: 5px; vertical-align: top; }
            .invoice-box table tr td:nth-child(2) { text-align: right; }
            .invoice-box table tr.top table td { padding-bottom: 20px; }
            .invoice-box table tr.information table td { padding-bottom: 40px; }
            .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
            .invoice-box table tr.details td { padding-bottom: 20px; }
            .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
            .invoice-box table tr.item.last td { border-bottom: none; }
            .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <table>
                <tr class="top">
                    <td colspan="2">
                        <table>
                            <tr>
                                <td class="title">
                                    <h2>Soft Factory</h2>
                                </td>
                                <td>
                                    Invoice #: ${invoice.id}<br>
                                    Date: ${new Date(invoice.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
                                    Owner: ${invoice.user.name}<br>
                                    Email: ${invoice.user.email}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr class="heading">
                    <td>Product</td>
                    <td>Price</td>
                </tr>

                ${invoice.products.map(product => `
                    <tr class="item">
                        <td>${product.name} (x${product.qty})</td>
                        <td>$${product.rate}</td>
                    </tr>
                `).join('')}

                <tr class="total">
                    <td></td>
                    <td>
                        Subtotal: $${invoice.products.reduce((sum, product) => sum + (product.qty * product.rate), 0).toFixed(2)}
                    </td>
                </tr>
                <tr class="total">
                    <td></td>
                    <td>
                        GST (18%): $${(invoice.products.reduce((sum, product) => sum + (product.qty * product.rate), 0) * 0.18).toFixed(2)}
                    </td>
                </tr>
                <tr class="total">
                    <td></td>
                    <td>
                        Total: $${(invoice.products.reduce((sum, product) => sum + (product.qty * product.rate), 0) * 1.18).toFixed(2)}
                    </td>
                </tr>
                <tr class="total">
                    <td></td>
                    <td>
                        <br><br><br><br>
                        Signature:<br>
                        Soft Industries
                    </td>
                </tr>
            </table>
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
