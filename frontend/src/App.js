// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AddProduct from './components/AddProduct';
import GenerateInvoice from './components/GenerateInvoice';
import withAuth from './components/withAuth';

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
          <Route path="/login" element={<Login setToken={setTokenHandler} />} />
          <Route path="/register" element={<Register setRegistered={() => { }} />} />
          <Route path="/add-product" element={React.createElement(withAuth(AddProduct), { token, setToken: setTokenHandler })} />
          <Route path="/generate-invoice" element={React.createElement(withAuth(GenerateInvoice), { token })} />
          <Route path="/" element={<Navigate to="/login" />} /> {/* Redirect root to login */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
