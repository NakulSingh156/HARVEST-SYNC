// HARVEST_SYNC/frontend/src/FarmerDashboard.jsx (Simplified for aesthetic implementation)

import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import YieldPredictionForm from './YieldPredictionForm.jsx';
import HealthAssistant from './HealthAssistant.jsx'; // Make sure this file exists!
import Marketplace from './Marketplace.jsx';       // Make sure this file exists!
import MyListings from './MyListings.jsx'; // Import MyListings
import ListingForm from './ListingForm.jsx';       // Import the new ListingForm
import OrderManager from './OrderManager.jsx';       // Import OrderManager

// Import the background image
import leafBg from './assets/leaf_bg.png';

const FarmerDashboard = () => {
    const { user, logout, userRole } = useAuth();
    const [activeTool, setActiveTool] = useState('planning');

    // Helper to get full role name for display
    const getRoleName = (roleCode) => {
        if (roleCode === 'F') return 'Farmer';
        if (roleCode === 'B') return 'Buyer';
        if (roleCode === 'L') return 'Logistics';
        return 'User';
    };

    const navItemClass = (tool) =>
        `px-6 py-2 rounded-t-lg transition-colors duration-200 ${activeTool === tool
            ? 'bg-white text-green-700 border-b-2 border-green-700 font-semibold shadow-sm'
            : 'text-gray-100 hover:text-white bg-green-800/50 hover:bg-green-700/50' // Improved contrast on tabs
        }`;

    return (
        // Main container with background image
        <div
            className="min-h-screen bg-cover bg-center bg-fixed"
            style={{
                backgroundImage: `url(${leafBg})`,
                backgroundColor: '#f0fdf4' // Fallback color
            }}
        >

            {/* Header / Nav Bar */}
            <header className="bg-green-700 text-white shadow-lg p-3 relative">
                <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
                    {/* Title (Reduced size) */}
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🌾</span>
                        <h1 className="text-lg font-bold tracking-wide">HARVEST-SYNC</h1>
                    </div>

                    {/* Welcome Message (Centered absolutely on desktop, or flex on mobile) */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
                        <span className="text-lg font-light tracking-wide">
                            Welcome! <span className="font-semibold">{user.username}</span> ({getRoleName(userRole)})
                        </span>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-4 rounded-full transition duration-150 shadow-md"
                    >
                        Logout
                    </button>
                </div>

                {/* Mobile Welcome Message (Visible only on small screens) */}
                <div className="md:hidden text-center mt-2 text-sm border-t border-green-600 pt-2">
                    Welcome, <b>{user.username}</b>
                </div>
            </header>

            {/* Dashboard Content Area */}
            <div className="max-w-6xl mx-auto mt-8 px-4">

                {/* Navigation Tabs */}
                <div className="flex space-x-1">
                    <button className={navItemClass('planning')} onClick={() => setActiveTool('planning')}>
                        Planning Tool
                    </button>
                    <button className={navItemClass('sales')} onClick={() => setActiveTool('sales')}>
                        Sales & Listings
                    </button>
                    <button className={navItemClass('health')} onClick={() => setActiveTool('health')}>
                        Health Assistant
                    </button>
                    <button className={navItemClass('marketplace')} onClick={() => setActiveTool('marketplace')}>
                        📦 My Products
                    </button>
                    <button className={navItemClass('orders')} onClick={() => setActiveTool('orders')}>
                        🚚 Order Manager
                    </button>
                </div>

                {/* Tool Content (Conditional Rendering) */}
                <div className="tool-content bg-white/95 backdrop-blur-sm p-8 shadow-2xl rounded-b-lg rounded-r-lg border-t-0 border border-green-100">
                    {/* 1. Planning Tool */}
                    {activeTool === 'planning' && <YieldPredictionForm />}
                    {/* 2. Sales Tool */}
                    {activeTool === 'sales' && <ListingForm />}
                    {/* 3. Health Tool */}
                    {activeTool === 'health' && <HealthAssistant />}
                    {/* 4. My Listings Shell */}
                    {activeTool === 'marketplace' && <MyListings />}
                    {/* 5. Order Manager */}
                    {activeTool === 'orders' && <OrderManager />}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
