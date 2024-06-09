// src/components/AddProduct.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddProduct.css'; // Import the CSS file

const AddProduct = ({ token }) => {
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');
    const [rate, setRate] = useState('');
    const [products, setProducts] = useState([]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/products', {
                headers: { 'x-auth-token': token },
            });
            console.log('Fetched products:', res.data); // Debugging
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/add-product', { name, qty, rate }, {
                headers: { 'x-auth-token': token },
            });
            setName('');
            setQty('');
            setRate('');
            fetchProducts(); // Refresh the product list
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateInvoice = async () => {
        console.log('Generating invoice with products:', products); // Debugging
        try {
            const res = await axios.post('http://localhost:5000/generate-invoice', { products }, {
                headers: { 'x-auth-token': token },
                responseType: 'arraybuffer' // Ensure the response is handled correctly
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'invoice.pdf';
            link.click();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="add-product-container">
            <h1>Add Products</h1>
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Product Name"
                        required
                    />
                    <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="Quantity"
                        required
                    />
                    <input
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="Rate"
                        required
                    />
                    <button type="submit">Add Product</button>
                </form>
            </div>

            <h2>Products</h2>
            <table className="product-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr key={index}>
                            <td>{product.name}</td>
                            <td>{product.qty}</td>
                            <td>{product.rate}</td>
                            <td>{product.qty * product.rate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button className="generate-invoice-button" onClick={handleGenerateInvoice}>Generate Invoice</button>
        </div>
    );
};

export default AddProduct;
