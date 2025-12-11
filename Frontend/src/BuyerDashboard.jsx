
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import FarmerDetailModal from './FarmerDetailModal';
import OrderModal from './OrderModal';

const BuyerDashboard = () => {
    const { user, logout } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering State
    const [filterCrop, setFilterCrop] = useState('');
    const [filterCity, setFilterCity] = useState('');

    // Tabs
    const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'orders'
    const [myOrders, setMyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Modal State
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [selectedListingForOrder, setSelectedListingForOrder] = useState(null);

    const fetchListings = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (filterCrop) params.append('crop', filterCrop);
            if (filterCity) params.append('city', filterCity);

            const response = await axios.get(`/api/listings/?${params.toString()}`);
            setListings(response.data);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchListings();
    }, []);

    // Fetch Orders when tab changes
    useEffect(() => {
        if (activeTab === 'orders') {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                try {
                    const response = await axios.get(`/api/orders/history/?username=${user.username}`);
                    setMyOrders(response.data);
                } catch (error) {
                    console.error("Error fetching orders:", error);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchOrders();
        }
    }, [activeTab, user.username]);

    // Handle filter submit
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchListings();
    };

    return (
        <div className="min-h-screen bg-green-50">
            {/* Header */}
            <header className="bg-green-700 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌱</span>
                    <h1 className="text-xl font-bold tracking-wide">HARVEST-SYNC MARKETPLACE</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-green-100">Welcome, {user.username} (Buyer)</span>
                    <button
                        onClick={logout}
                        className="bg-green-800 hover:bg-green-900 px-3 py-1 rounded text-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-white shadow border-b">
                <div className="max-w-7xl mx-auto flex">
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'marketplace' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        🛍️ Marketplace
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'orders' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        📦 My Orders
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">

                {/* MARKETPLACE VIEW */}
                {activeTab === 'marketplace' && (
                    <>
                        {/* Filters Section */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 animate-fade-in-down">
                            <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-gray-600 text-sm font-medium mb-1">Filter by Crop</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rice, Wheat"
                                        className="w-full p-2 border rounded text-gray-900"
                                        value={filterCrop}
                                        onChange={(e) => setFilterCrop(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-gray-600 text-sm font-medium mb-1">Filter by Location (City)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Nashik, Pune"
                                        className="w-full p-2 border rounded text-gray-900"
                                        value={filterCity}
                                        onChange={(e) => setFilterCity(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition w-full md:w-auto">
                                    🔍 Search
                                </button>
                                <button type="button" onClick={() => { setFilterCrop(''); setFilterCity(''); fetchListings(); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium transition w-full md:w-auto">
                                    Reset
                                </button>
                            </form>
                        </div>


                        {/* Listings Grid */}
                        {loading ? (
                            <div className="text-center py-20 text-gray-500">Loading marketplace...</div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Products</h2>
                                {listings.length === 0 ? (
                                    <div className="text-center py-10 bg-white rounded shadow text-gray-500">
                                        No listings found matching your criteria.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {listings.map(item => (
                                            <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 flex flex-col">
                                                <div className="bg-green-100 p-4 flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-800">{item.crop_name}</h3>
                                                        <p className="text-green-700 font-medium text-sm">₹{(item.price / 1000).toFixed(2)} / kg</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.quality === 'A' ? 'bg-green-200 text-green-800' :
                                                        item.quality === 'B' ? 'bg-yellow-200 text-yellow-800' : 'bg-orange-200 text-orange-800'
                                                        }`}>
                                                        Grade {item.quality}
                                                    </span>
                                                </div>

                                                <div className="p-4 flex-grow space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Quantity:</span>
                                                        <span className="font-medium text-gray-800">{item.quantity} Tons</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Storage:</span>
                                                        <span className="text-gray-800">{item.storage}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Location:</span>
                                                        <span className="text-gray-800">{item.farmer_city || "Unknown"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Farmer:</span>
                                                        <button
                                                            onClick={() => setSelectedFarmer(item.farmer_id)}
                                                            className="text-green-600 hover:underline font-medium"
                                                        >
                                                            {item.farmer_name}
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-2 text-right">Posted: {item.date}</div>
                                                </div>

                                                <div className="p-4 border-t bg-gray-50">
                                                    <button
                                                        onClick={() => setSelectedListingForOrder(item)}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition shadow-sm hover:shadow"
                                                    >
                                                        🛒 Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* MY ORDERS VIEW */}
                {activeTab === 'orders' && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Order History</h2>
                        {loadingOrders ? (
                            <div className="text-center py-20 text-gray-500">Loading your orders...</div>
                        ) : myOrders.length === 0 ? (
                            <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
                                You haven't placed any orders yet. Go to the Marketplace to start shopping!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myOrders.map(order => (
                                    <div key={order.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                                        <div className="mb-2 md:mb-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-lg font-bold text-gray-800">{order.crop_name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Order #{order.id} • {order.date} • Seller: <strong>{order.farmer_name}</strong>
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-6 text-sm">
                                            <div className="text-right">
                                                <p className="text-gray-500">Quantity</p>
                                                <p className="font-medium">{order.quantity_kg.toFixed(1)} kg</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-500">Total Price</p>
                                                <p className="font-bold text-green-700">₹{order.total_price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {selectedFarmer && (
                <FarmerDetailModal
                    farmerId={selectedFarmer}
                    onClose={() => setSelectedFarmer(null)}
                />
            )}

            {selectedListingForOrder && (
                <OrderModal
                    listing={selectedListingForOrder}
                    buyerUsername={user.username}
                    onClose={() => {
                        setSelectedListingForOrder(null);
                        fetchListings(); // Refresh listings to update quantity
                    }}
                />
            )}
        </div>
    );
};

export default BuyerDashboard;