// src/components/withAuth.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const withAuth = (Component) => {
    return (props) => {
        const token = localStorage.getItem('token');
        if (!token) {
            return <Navigate to="/login" />;
        }
        return <Component {...props} />;
    };
};

export default withAuth;
