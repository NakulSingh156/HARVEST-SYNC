
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const MyListings = () => {
    const { user } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyListings = async () => {
            try {
                // Fetch listings filtered by the current user's username
                // Fetch listings filtered by the current user's username
                const response = await axios.get(`/api/listings/?username=${user.username}`);
                if (Array.isArray(response.data)) {
                    setListings(response.data);
                } else {
                    console.error("API returned non-array:", response.data);
                    setListings([]);
                }
            } catch (error) {
                console.error("Error fetching my listings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyListings();
    }, [user.username]);

    return (
        <div className="p-4 animate-fade-in-down">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 My Product Listings</h2>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading your products...</div>
            ) : listings.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm border text-center text-gray-500">
                    <p className="mb-4">You haven't posted any products yet.</p>
                    <p className="text-sm">Use the "Sales & Listings" tool to add your first crop!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(item => (
                        <div key={item.id} className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm relative overflow-hidden">
                            {/* Quality Badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg border-b border-l ${item.quality === 'A' ? 'bg-green-100 text-green-800' :
                                item.quality === 'B' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                Grade {item.quality}
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-2">{item.crop_name}</h3>

                            <div className="space-y-1 text-sm text-gray-600">
                                <p><strong>Price:</strong> <span className="text-green-700 font-bold">₹{item.price}</span> / ton</p>
                                <p><strong>Stock:</strong> {item.quantity} Tons</p>
                                <p><strong>Storage:</strong> {item.storage}</p>
                                <p className="text-xs text-gray-400 mt-2">Posted: {item.date}</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-5 -mb-5 px-5 py-3">
                                <span className={`text-xs font-bold uppercase tracking-wider ${item.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {item.quantity > 0 ? '● Active Listing' : '● Validating / Sold Out'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyListings;
