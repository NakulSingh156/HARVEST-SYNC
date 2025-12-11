
import React, { useState } from 'react';
import axios from 'axios';

const OrderModal = ({ listing, buyerUsername, onClose }) => {
    const [quantityKg, setQuantityKg] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Calculate dynamic price
    const qtyTons = parseFloat(quantityKg) / 1000 || 0;
    const totalPrice = (qtyTons * listing.price).toFixed(2);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post('/api/orders/place/', {
                buyer_username: buyerUsername,
                listing_id: listing.id,
                quantity_kg: quantityKg,
                delivery_address: address,
                phone_number: phone
            });

            if (response.status === 201) {
                setMessage("Order placed successfully! 🎉");
                setTimeout(() => {
                    onClose(); // Close after success
                }, 2000);
            }
        } catch (err) {
            console.error("Order failed:", err);
            setError(err.response?.data?.error || "Failed to place order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">📦 Place Order: {listing.crop_name}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
                </div>

                {message ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">✅</div>
                        <p className="text-green-600 font-bold text-lg">{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handlePlaceOrder} className="space-y-4">
                        {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}

                        <div className="bg-green-50 p-3 rounded text-sm text-gray-700">
                            <p><strong>Seller:</strong> {listing.farmer_name}</p>
                            <p><strong>Price:</strong> ₹{(listing.price / 1000).toFixed(2)} / kg</p>
                            <p><strong>Available:</strong> {listing.quantity} Tons</p>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Quantity (kg)</label>
                            <input
                                type="number"
                                value={quantityKg}
                                onChange={(e) => setQuantityKg(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                                placeholder="e.g. 500"
                                required
                            />
                            {quantityKg && (
                                <p className="text-xs text-green-600 mt-1">
                                    Total Price: <strong>₹{totalPrice}</strong> ({qtyTons} Tons)
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Delivery Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                                placeholder="Full street address..."
                                rows="2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                                placeholder="+91 9876543210"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {loading ? 'Processing...' : `Confirm Order (₹${totalPrice})`}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default OrderModal;
