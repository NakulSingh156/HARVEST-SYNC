import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext.jsx';
// Note: In a real app, you'd use @react-google-maps/api or similar
// For this MVP, we'll try to embed a map or link to directions if User Location is available.

const LogisticsDashboard = () => {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRoute, setActiveRoute] = useState(null); // Selected order for tracking

    // Fetch Pending Deliveries
    const fetchDeliveries = async () => {
        try {
            const response = await axios.get(`/api/logistics/pending/?username=${user.username}`);
            setDeliveries(response.data);
        } catch (error) {
            console.error("Error/No Deliveries:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
        // Poll for new shipments every 30 seconds
        const interval = setInterval(fetchDeliveries, 30000);
        return () => clearInterval(interval);
    }, [user.username]);

    const startDelivery = async (orderId) => {
        try {
            await axios.post('/api/logistics/start/', { order_id: orderId });
            alert("Delivery Started! 🚚");
            fetchDeliveries(); // Refresh list (it might move to 'In Progress' section if we had one)
            // For now, finding the order locally to show map
            const order = deliveries.find(d => d.id === orderId);
            if (order) setActiveRoute(order);
        } catch (error) {
            alert("Failed to start delivery.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
            <header className="mb-8 flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                        🚚 Logistics Command Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Agent: <span className="text-white font-semibold">{user.username}</span>
                    </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                    <p>System Status: <span className="text-green-500">● Online</span></p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT PANEL: PENDING LIST */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 lg:col-span-1">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400">
                        📦 Ready for Pickup
                        <span className="ml-2 bg-blue-900 text-blue-200 text-xs px-2 py-0.5 rounded-full">{deliveries.length}</span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-10 text-gray-500 animate-pulse">Scanning for shipments...</div>
                    ) : deliveries.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                            <p>No new shipments assigned.</p>
                            <p className="text-xs mt-2 text-gray-600">Waiting for farmer to ship orders...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {deliveries.map(order => (
                                <div key={order.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition cursor-pointer group"
                                    onClick={() => setActiveRoute(order)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-white">{order.crop}</h3>
                                        <span className="text-blue-400 text-xs font-mono">#{order.id}</span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-300">
                                        <div className="flex items-center">
                                            <span className="w-6 text-center mr-2">⚖️</span>
                                            <span>{order.qty} KG</span>
                                        </div>
                                        <div className="flex items-center text-green-300 bg-green-900/20 p-1 rounded">
                                            <span className="w-6 text-center mr-2">👨‍🌾</span>
                                            <span>Pickup (Farmer): <b>Has Listing</b></span>
                                            {/* Note: PendingDeliveryAPI didn't carry farmer name explicitly in list map, 
                                                but listing implies the valid farmer. 
                                                Ideally we add farmer name to API. 
                                            */}
                                        </div>
                                        <div className="flex items-center text-orange-300 bg-orange-900/20 p-1 rounded">
                                            <span className="w-6 text-center mr-2">📍</span>
                                            <span>Drop: <b>{order.buyer_address}</b></span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); startDelivery(order.id); }}
                                        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded shadow-md transition transform group-hover:scale-[1.02]"
                                    >
                                        Start Delivery Route 🚀
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: MAP VISUALIZATION */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 lg:col-span-2 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-green-400">
                        🗺️ Route Optimization
                    </h2>

                    <div className="flex-grow bg-gray-900 rounded-lg overflow-hidden relative border border-gray-600">
                        {activeRoute ? (
                            <div className="absolute inset-0 flex flex-col">
                                {/* Route Header */}
                                <div className="bg-gray-800/90 backdrop-blur p-4 z-10 flex justify-between items-center border-b border-gray-700">
                                    <div>
                                        <h3 className="font-bold">Route #{activeRoute.id}: {activeRoute.crop}</h3>
                                        <p className="text-xs text-gray-400">Optimal Path Calculated</p>
                                    </div>
                                    <div className="text-right text-xs">
                                        <p>Est. Distance: <span className="text-white">Calculating...</span></p>
                                        <p>ETA: <span className="text-white">Checking Traffic...</span></p>
                                    </div>
                                </div>

                                {/* MAP FRAME */}
                                {/* Using Google Maps Embed API for demo simplicity (Direction Mode) */}
                                {activeRoute.farmer_lat && activeRoute.buyer_lat ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/directions?key=YOUR_GOOGLE_MAPS_API_KEY_HERE&origin=${activeRoute.farmer_lat},${activeRoute.farmer_lng}&destination=${activeRoute.buyer_lat},${activeRoute.buyer_lng}&mode=driving`}
                                    ></iframe>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <p className="text-4xl mb-2">📡</p>
                                            <p>Live Map Data Unavailable (Missing Coordinates)</p>
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&origin=${activeRoute.farmer_lat || ''},${activeRoute.farmer_lng || ''}&destination=${activeRoute.buyer_address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 inline-block text-blue-400 hover:text-blue-300 underline"
                                            >
                                                Open Google Maps Externally
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Select an order to view optimal route.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsDashboard;