// src/components/withAuth.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const withAuth = (WrappedComponent) => {
    return (props) => {
        const navigate = useNavigate();

        useEffect(() => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
            }
        }, [navigate]);

        const token = localStorage.getItem('token');
        if (!token) {
            return null; // Or a loading spinner, or a message saying "Redirecting to login..."
        }

        return <WrappedComponent {...props} token={token} />;
    };
};

export default withAuth;
