// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AddProduct from './components/AddProduct';
import GenerateInvoice from './components/GenerateInvoice';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const setTokenHandler = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setToken={setTokenHandler} />} />
          <Route path="/register" element={<Register setRegistered={() => { }} />} />
          <Route path="/add-product" element={<AddProduct token={token} />} />
          <Route path="/generate-invoice" element={<GenerateInvoice token={token} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
