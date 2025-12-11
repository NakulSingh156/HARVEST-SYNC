// HARVEST_SYNC/frontend/src/YieldPredictionForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

// --- Note: Add your specific CSS styles to App.css or index.css for formatting ---

const YieldPredictionForm = () => {
    // Initial state matching the inputs needed for your Django API
    const [formData, setFormData] = useState({
        crop: 'Rice', state: 'Assam', farmArea: 5, year: 2026,
        fertilizer: 2.5, pesticide: 1.2, season: 'Kharif'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        // Ensure data types are correct for the API (e.g., numbers)
        const dataToSend = {
            ...formData,
            farmArea: parseFloat(formData.farmArea),
            year: parseInt(formData.year),
            fertilizer: parseFloat(formData.fertilizer),
            pesticide: parseFloat(formData.pesticide),
        };

        try {
            // URL MUST match your Django API endpoint
            const response = await axios.post('/api/predict_yield/', dataToSend);
            setResult(response.data);
        } catch (error) {
            console.error('Prediction Error:', error);
            // Handle specific error case
            setResult({ error: error.response?.data?.error || 'Failed to connect to the prediction server.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        // HARVEST-SYNC/frontend/src/YieldPredictionForm.jsx (Targeted Styling)

        // ... (Inside the return block for the form) ...

        <div className="p-4">
            {/* Conditional Rendering: Show Form OR Result Card */}
            {!result ? (
                <>
                    <h2 className="text-2xl font-bold mb-6 text-green-800">🌾 Crop Planning Tool</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Crop Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
                                <input name="crop" type="text" placeholder="e.g. Rice"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm hover:border-green-300"
                                    onChange={handleChange} value={formData.crop}
                                />
                            </div>

                            {/* State Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input name="state" type="text" placeholder="e.g. Assam"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm hover:border-green-300"
                                    onChange={handleChange} value={formData.state}
                                />
                            </div>

                            {/* Farm Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Area (Hectares)</label>
                                <input name="farmArea" type="number" step="0.1" placeholder="e.g. 5.0"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm hover:border-green-300"
                                    onChange={handleChange} value={formData.farmArea}
                                />
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <input name="year" type="number" placeholder="e.g. 2026"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm hover:border-green-300"
                                    onChange={handleChange} value={formData.year}
                                />
                            </div>

                            {/* Fertilizer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer (kg/ha)</label>
                                <input name="fertilizer" type="number" step="0.1" placeholder="e.g. 100.0"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm hover:border-green-300"
                                    onChange={handleChange} value={formData.fertilizer}
                                />
                            </div>

                            {/* Pesticide */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pesticide (kg/ha)</label>
                                <input name="pesticide" type="number" step="0.01" placeholder="e.g. 2.50"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm hover:border-green-300"
                                    onChange={handleChange} value={formData.pesticide}
                                />
                            </div>
                        </div>

                        {/* Season and Submit */}
                        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
                            <div className="w-full md:w-1/3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                                <select name="season"
                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                                    onChange={handleChange} value={formData.season}
                                >
                                    <option value="Kharif">Kharif</option>
                                    <option value="Rabi">Rabi</option>
                                    <option value="Zaid">Zaid</option>
                                    <option value="Whole Year">Whole Year</option>
                                    <option value="Autumn">Autumn</option>
                                    <option value="Summer">Summer</option>
                                    <option value="Winter">Winter</option>
                                </select>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-lg transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Calculating...' : 'Predict Yield & Income'}
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                // --- RESULT CARD (Dark Glassmorphism) ---
                <div className="bg-black/80 text-white rounded-xl shadow-2xl p-8 backdrop-blur-md border border-gray-700 animate-fade-in relative overflow-hidden">
                    {/* Decorative top glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400"></div>

                    {result.error ? (
                        <div className="text-center py-10">
                            <h3 className="text-2xl font-bold text-red-500 mb-2">Error Encountered</h3>
                            <p className="text-gray-300">{result.error}</p>
                            <button onClick={() => setResult(null)} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Back</button>
                        </div>
                    ) : (
                        <>
                            {/* Key Metrics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center border-b border-gray-700 pb-8">
                                <div>
                                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Yield Rate</p>
                                    <p className="text-3xl font-bold text-yellow-400">
                                        {parseFloat(result.predicted_yield_rate).toFixed(2)} <span className="text-lg text-white font-normal">tons/ha</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Yield ({formData.farmArea} ha)</p>
                                    <p className="text-3xl font-bold text-yellow-400">
                                        {parseFloat(result.total_yield).toFixed(2)} <span className="text-lg text-white font-normal">tons</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Expected Income</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        ₹ {Math.round(result.expected_income).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            {/* Recommendations Section */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-green-400 text-center border-b border-gray-700 pb-2 inline-block mx-auto w-full">
                                    Recommendations
                                </h3>

                                {/* Comparison Box */}
                                <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-yellow-500">
                                    <p className="text-gray-200 font-medium">
                                        {result.solution.comparison_text}
                                    </p>
                                </div>

                                {/* Detailed Text Blocks */}
                                <div className="text-sm space-y-4 text-gray-300 leading-relaxed">
                                    <p><strong className="text-white">Our Advice:</strong> {result.solution.main_advice}</p>
                                    <p><strong className="text-white">Market Info (MSP):</strong> {result.solution.msp_info}</p>
                                    <p><strong className="text-white">Storage Tips:</strong> {result.solution.storage_tips}</p>
                                    <p><strong className="text-white">Govt. Schemes:</strong> {result.solution.schemes}</p>
                                </div>
                            </div>

                            {/* Back Button */}
                            <div className="mt-10 text-center">
                                <button
                                    onClick={() => setResult(null)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1"
                                >
                                    ← Back
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default YieldPredictionForm;