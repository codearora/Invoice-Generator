// src/components/AddProduct.js
import React, { useState } from 'react';
import axios from 'axios';

const AddProduct = ({ token }) => {
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');
    const [rate, setRate] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/add-product', { name, qty, rate }, {
                headers: { 'x-auth-token': token },
            });
            setName('');
            setQty('');
            setRate('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
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
    );
};

export default AddProduct;