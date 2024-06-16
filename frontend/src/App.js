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
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  const setTokenHandler = (newToken, user) => {
    setToken(newToken);
    setUser(user);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const AuthenticatedAddProduct = withAuth(() => <AddProduct token={token} setToken={setTokenHandler} user={user} />);
  const AuthenticatedGenerateInvoice = withAuth(() => <GenerateInvoice token={token} />);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login setToken={setTokenHandler} />} />
          <Route path="/register" element={<Register setRegistered={() => { }} />} />
          <Route path="/add-product" element={<AuthenticatedAddProduct />} />
          <Route path="/generate-invoice" element={<AuthenticatedGenerateInvoice />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
