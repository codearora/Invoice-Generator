// src/components/withAuth.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const withAuth = (WrappedComponent) => {
    return (props) => {
        const navigate = useNavigate();
        const token = localStorage.getItem('token');

        React.useEffect(() => {
            if (!token) {
                navigate('/login');
            }
        }, [navigate, token]);

        return token ? <WrappedComponent {...props} /> : null;
    };
};

export default withAuth;
