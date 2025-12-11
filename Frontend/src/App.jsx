// HARVEST-SYNC/frontend/src/App.jsx (CORRECTED & UPDATED)

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage.jsx'; 
import { useAuth } from './AuthContext.jsx';

// --- Import all Dashboard Components ---
import FarmerDashboard from './FarmerDashboard.jsx'; // F - Planning/Health
// You need to create these files as placeholders (BuyerDashboard.jsx, LogisticsDashboard.jsx)
import BuyerDashboard from './BuyerDashboard.jsx';     // B - Marketplace
import LogisticsDashboard from './LogisticsDashboard.jsx'; // L - Optimization
// ----------------------------------------

const App = () => {
    // Get login status and the stored user role from context
    const { isLoggedIn, userRole } = useAuth();

    // Helper component to enforce protection and handle initial redirection
    const ProtectedRoute = ({ children }) => {
        if (!isLoggedIn) {
            return <Navigate to="/login" replace />;
        }
        return children;
    };

    return (
        <Router>
            <Routes>
                {/* Default route points to the Login Page */}
                <Route path="/" element={<Navigate replace to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* --- Protected Dashboard Routes --- */}

                {/* Farmer Dashboard (Role 'F') */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            {/* Check if user role matches. If not, redirect based on their stored role. */}
                            {userRole === 'F' ? <FarmerDashboard /> : <Navigate to={userRole === 'B' ? '/buyer-dashboard' : '/logistics-dashboard'} replace />}
                        </ProtectedRoute>
                    } 
                />
                
                {/* Buyer Dashboard (Role 'B') */}
                <Route 
                    path="/buyer-dashboard" 
                    element={
                        <ProtectedRoute>
                            {userRole === 'B' ? <BuyerDashboard /> : <Navigate to="/dashboard" replace />}
                        </ProtectedRoute>
                    } 
                />

                {/* Logistics Dashboard (Role 'L') */}
                <Route 
                    path="/logistics-dashboard" 
                    element={
                        <ProtectedRoute>
                            {userRole === 'L' ? <LogisticsDashboard /> : <Navigate to="/dashboard" replace />}
                        </ProtectedRoute>
                    } 
                />
                
            </Routes>
        </Router>
    );
};

export default App;