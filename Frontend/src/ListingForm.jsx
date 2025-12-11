import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ListingForm = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        crop_name: '',
        quantity: '',
        price: '',
        quality: 'A',
        storage: 'Standard'
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            await axios.post('/api/listings/create/', {
                username: user.username, // In a real app, use token. Here we rely on username for simplicity as per existing views.
                ...formData
            });
            setMessage('Listing posted successfully! It is now live in the Marketplace.');
            setFormData({ crop_name: '', quantity: '', price: '', quality: 'A', storage: 'Standard' });
        } catch (err) {
            console.error(err);
            setError('Failed to post listing. Please try again.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-green-700 mb-4">📢 Post a New Crop Listing</h2>

            {message && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{message}</div>}
            {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Crop Name</label>
                    <input
                        type="text"
                        name="crop_name"
                        value={formData.crop_name}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                        placeholder="e.g. Basmati Rice, Wheat"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Quantity (Tons)</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                            placeholder="e.g. 5.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Price per Unit (₹)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                            placeholder="e.g. 2500"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Quality Grade</label>
                        <select
                            name="quality"
                            value={formData.quality}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                        >
                            <option value="A">Grade A (Premium)</option>
                            <option value="B">Grade B (Standard)</option>
                            <option value="C">Grade C (Fair)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Storage Type</label>
                        <select
                            name="storage"
                            value={formData.storage}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                        >
                            <option value="Standard">Standard Warehouse</option>
                            <option value="Cold Storage">Cold Storage</option>
                            <option value="Silo">Silo</option>
                            <option value="Open Air">Open Air</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 mt-4"
                >
                    🚀 Publish Listing
                </button>
            </form>
        </div>
    );
};

export default ListingForm;
