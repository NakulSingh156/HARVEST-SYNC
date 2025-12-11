// HARVEST_SYNC/frontend/src/Marketplace.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FarmerDetailModal from './FarmerDetailModal'; // Import the new modal

const Marketplace = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null); // Track selected farmer for modal

    // Use the relative path so Vite proxy handles the host/port
    const API_BASE_PATH = '/api/listings/';

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await axios.get(API_BASE_PATH);
                setListings(response.data);
            } catch (error) {
                console.error("Error fetching listings:", error);
                setListings([{ id: 0, crop_name: "Error loading marketplace data.", price_per_unit: 'N/A' }]);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    const getQualityBadgeColor = (grade) => {
        if (grade === 'A') return 'bg-green-100 text-green-800 border-green-200';
        if (grade === 'B') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4 text-gray-700">🛒 Local Marketplace Feed</h1>
            <p className="text-sm text-gray-500 mb-6">Explore high-quality crops directly from farmers.</p>

            {loading ? (
                <div className="flex justify-center p-8">
                    <span className="text-green-600 animate-pulse font-semibold">Loading available listings...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(item => (
                        <div key={item.id} className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-1 relative overflow-hidden group">

                            {/* Quality Badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg border-b border-l ${getQualityBadgeColor(item.quality)}`}>
                                Grade {item.quality}
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-1">{item.crop_name}</h3>

                            <div className="text-sm text-gray-600 mb-3 space-y-1">
                                <p><strong>Amount:</strong> {item.quantity} Tons</p>
                                <p><strong>Price:</strong> <span className="text-green-700 font-bold text-lg">₹{item.price}</span> / unit</p>
                                <p><strong>Storage:</strong> {item.storage}</p>
                                <p className="text-xs text-gray-400">Posted on: {item.date}</p>
                            </div>

                            <div className="mt-4 flex justify-between items-center border-t pt-3">
                                <div className="text-xs">
                                    <span className="text-gray-500">Farmer:</span><br />
                                    <span
                                        className="font-semibold text-green-700 cursor-pointer hover:underline"
                                        onClick={() => setSelectedFarmerId(item.farmer_id)}
                                    >
                                        @{item.farmer_name}
                                    </span>
                                </div>
                                <button
                                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-md transition"
                                    onClick={() => setSelectedFarmerId(item.farmer_id)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Render Modal if a farmer is selected */}
            {selectedFarmerId && (
                <FarmerDetailModal
                    farmerId={selectedFarmerId}
                    onClose={() => setSelectedFarmerId(null)}
                />
            )}
        </div>
    );
};

export default Marketplace;