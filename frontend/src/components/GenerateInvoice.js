// src/components/GenerateInvoice.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GenerateInvoice = ({ token }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
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

        fetchProducts();
    }, [token]);

    const handleGenerateInvoice = async () => {
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
            <h1>Generate Invoice</h1>
            <button onClick={handleGenerateInvoice}>Generate Invoice</button>
        </div>
    );
};

export default GenerateInvoice;