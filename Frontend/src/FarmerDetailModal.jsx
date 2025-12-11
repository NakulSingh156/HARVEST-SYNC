import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FarmerDetailModal = ({ farmerId, onClose }) => {
    const [farmerData, setFarmerData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axios.get(`/api/farmer/${farmerId}/`);
                setFarmerData(response.data);
            } catch (error) {
                console.error("Error fetching farmer details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (farmerId) {
            fetchDetails();
        }
    }, [farmerId]);

    if (!farmerId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="bg-green-700 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">🌾 Farmer Profile</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 font-bold text-xl">&times;</button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8">Loading profile...</div>
                    ) : farmerData ? (
                        <div className="space-y-6">

                            {/* Profile Header */}
                            <div className="flex items-center space-x-4 border-b pb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">👨‍🌾</div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{farmerData.name}</h3>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-gray-600 font-medium">{farmerData.farm_name}</p>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                                            {farmerData.farm_type || "Farm"}
                                        </span>
                                    </div>

                                    {/* Location & Age */}
                                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                        {farmerData.city && <p>📍 {farmerData.city}</p>}
                                        {farmerData.age && <p>🎂 {farmerData.age} years old</p>}
                                    </div>

                                    <div className="flex items-center mt-2">
                                        <span className="text-yellow-500 font-bold mr-1">★ {farmerData.avg_rating}</span>
                                        <span className="text-sm text-gray-500">({farmerData.review_count} reviews)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sales History */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">📜 Recent Sales History</h4>
                                {farmerData.history.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                                <tr>
                                                    <th className="py-2 px-3">Crop</th>
                                                    <th className="py-2 px-3">Date</th>
                                                    <th className="py-2 px-3">Quality</th>
                                                    <th className="py-2 px-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {farmerData.history.map((sale, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-2 px-3 text-gray-800">{sale.crop}</td>
                                                        <td className="py-2 px-3 text-gray-800">{sale.date}</td>
                                                        <td className="py-2 px-3">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${sale.quality === 'A' ? 'bg-green-100 text-green-800' :
                                                                sale.quality === 'B' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>{sale.quality}</span>
                                                        </td>
                                                        <td className="py-2 px-3 text-gray-800">{sale.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No recent sales visible.</p>
                                )}
                            </div>

                            {/* Reviews */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">💬 Buyer Reviews</h4>
                                <div className="space-y-3">
                                    {farmerData.reviews.length > 0 ? (
                                        farmerData.reviews.map((review, idx) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-100">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-sm">{review.buyer}</span>
                                                    <span className="text-xs text-gray-500">{review.date}</span>
                                                </div>
                                                <div className="flex items-center mb-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                                    ))}
                                                </div>
                                                <p className="text-gray-600 text-sm">{review.text}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">No reviews yet.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-red-500">Failed to load details.</div>
                    )}
                </div>

                <div className="bg-gray-50 p-4 flex justify-end">
                    <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmerDetailModal;
