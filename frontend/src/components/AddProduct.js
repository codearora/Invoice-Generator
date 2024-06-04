// src/components/AddProduct.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        console.log('Generating invoice with products:', products); // Add this line for debugging
        try {
            const res = await axios.post('http://localhost:5000/generate-invoice', { products }, {
                headers: { 'x-auth-token': token },
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
        <div>
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

            <h2>Products</h2>
            <ul>
                {products.map((product, index) => (
                    <li key={index}>
                        {product.name} - {product.qty} units @ ${product.rate}/unit
                    </li>
                ))}
            </ul>

            <button onClick={handleGenerateInvoice}>Generate Invoice</button>
        </div>
    );
};

export default AddProduct;
