// HARVEST_SYNC/frontend/src/AuthContext.jsx (UPDATED)

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    // State now stores user object: { username: '...', role: 'F' }
    const [user, setUser] = useState(null); 
    
    // Function updated to accept the role code
    const login = (username, role) => { 
        setUser({ username, role }); 
    };

    const logout = () => {
        setUser(null);
    };

    const value = {
        user,
        isLoggedIn: !!user,
        userRole: user ? user.role : null, // Easily expose the role code
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};