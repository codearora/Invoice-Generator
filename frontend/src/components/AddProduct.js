// src/components/AddProduct.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css'; // Import the CSS file

const AddProduct = ({ token, setToken }) => {
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');
    const [rate, setRate] = useState('');
    const [products, setProducts] = useState([]);
    const [editingProductId, setEditingProductId] = useState(null);
    const navigate = useNavigate();

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
            if (editingProductId) {
                await axios.put(`http://localhost:5000/update-product/${editingProductId}`, { name, qty, rate }, {
                    headers: { 'x-auth-token': token },
                });
                setEditingProductId(null);
            } else {
                await axios.post('http://localhost:5000/add-product', { name, qty, rate }, {
                    headers: { 'x-auth-token': token },
                });
            }
            setName('');
            setQty('');
            setRate('');
            fetchProducts(); // Refresh the product list
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (product) => {
        setName(product.name);
        setQty(product.qty);
        setRate(product.rate);
        setEditingProductId(product.id);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/delete-product/${id}`, {
                headers: { 'x-auth-token': token },
            });
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

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleReset = () => {
        setName('');
        setQty('');
        setRate('');
        setProducts([]);
        setEditingProductId(null);
    };

    return (
        <div className="add-product-container">
            <h1>Add Products</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
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
                    <button type="submit">{editingProductId ? 'Update Product' : 'Add Product'}</button>
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr key={index}>
                            <td>{product.name}</td>
                            <td>{product.qty}</td>
                            <td>{product.rate}</td>
                            <td>{product.qty * product.rate}</td>
                            <td className="actions">
                                <button className="edit" onClick={() => handleEdit(product)}>Edit</button>
                                <button onClick={() => handleDelete(product.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button className="generate-invoice-button" onClick={handleGenerateInvoice}>Generate Invoice</button>
            <button className="reset-button" onClick={handleReset}>Reset</button>
        </div>
    );
};

export default AddProduct;
