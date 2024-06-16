// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AddProduct from './components/AddProduct';
import GenerateInvoice from './components/GenerateInvoice';
import withAuth from './components/withAuth';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const setTokenHandler = (newToken) => {
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } else {
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const AuthenticatedAddProduct = withAuth(AddProduct);
  const AuthenticatedGenerateInvoice = withAuth(GenerateInvoice);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login setToken={setTokenHandler} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/add-product" element={<AuthenticatedAddProduct setToken={setTokenHandler} />} />
          <Route path="/generate-invoice" element={<AuthenticatedGenerateInvoice setToken={setTokenHandler} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
