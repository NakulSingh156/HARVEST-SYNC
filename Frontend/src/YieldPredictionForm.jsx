// HARVEST_SYNC/frontend/src/YieldPredictionForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Note: Add your specific CSS styles to App.css or index.css for formatting ---

// --- INTERNAL COMPONENTS ---

const WeatherWidget = () => {
    // Mock Data (Demo Robustness)
    const weather = { temp: 24, condition: "Clear Sky", location: "Hubballi", icon: "☀️" };

    return (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-white shadow-lg flex items-center gap-4 border border-blue-400/30">
            <div className="text-4xl">{weather.icon}</div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Live Weather</p>
                <p className="text-lg font-bold">{weather.location}</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{weather.temp}°C</span>
                    <span className="text-sm opacity-90">{weather.condition}</span>
                </div>
            </div>
        </div>
    );
};

const MarketTicker = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 h-10 flex items-center z-50 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee flex gap-8 px-4">
                {/* Duplicate the list to create seamless loop effect */}
                {[...data, ...data].map((item, idx) => (
                    <div key={`${item.timestamp}-${idx}`} className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-yellow-400">{item.commodity}</span>
                        <span className="text-gray-400">in</span>
                        <span className="text-gray-300">{item.market}, {item.state}</span>
                        <span className="font-bold text-green-400">₹{item.modal_price}/Q</span>
                        <span className="text-xs text-gray-500">({item.arrival_date})</span>
                        <span className="text-gray-600">|</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function YieldPredictionForm() {
    const [formData, setFormData] = useState({
        crop: '',
        crop_year: new Date().getFullYear(),
        state: '',
        annual_rainfall: '',
        fertilizer: '',
        pesticide: '',
        season: '',
        area: '',
        district: ''
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(''); // Fix: Define error state

    console.log("Farmer Dashboard (YieldPredictionForm) Loading..."); // Debug log
    const [tickerData, setTickerData] = useState([]);
    const [dosageData, setDosageData] = useState({});
    const [autoFilled, setAutoFilled] = useState(false);

    // Full list of Indian States/UTs
    const INDIAN_STATES = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
        "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
        "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
        "Lakshadweep", "Puducherry"
    ];

    // Fetch Dosage Data on Load
    useEffect(() => {
        const fetchDosageData = async () => {
            try {
                const res = await axios.get('/api/crop-dosages/');
                setDosageData(res.data);
            } catch (err) {
                console.error("Failed to load dosage data", err);
            }
        };
        fetchDosageData();
    }, []);

    // Smart-Fill Logic
    // Smart-Fill Logic (Updated for Agronomy Master JSON)
    useEffect(() => {
        const crop = formData.crop;
        const area = parseFloat(formData.area);
        const state = formData.state; // Capture state for wisdom

        if (crop && area && dosageData[crop]) {
            // New structure: dosageData[crop].f_per_ha
            const f_per_ha = dosageData[crop].f_per_ha || 0;
            const p_per_ha = dosageData[crop].p_per_ha || 0;

            const total_f = (f_per_ha * area).toFixed(2);
            const total_p = (p_per_ha * area).toFixed(2);

            setFormData(prev => ({
                ...prev,
                fertilizer: total_f,
                pesticide: total_p
            }));
            setAutoFilled(true);
        } else {
            setAutoFilled(false);
        }
    }, [formData.crop, formData.area, formData.state, dosageData]); // Store ticker data

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setTickerData([]);
        // setTickerData([]); // Removed as it's now handled after successful prediction

        // The payload now directly uses formData as it's updated by auto-calculation
        const payload = {
            crop: formData.crop,
            state: formData.state,
            district: formData.district, // Include district
            year: formData.crop_year,
            fertilizer: parseFloat(formData.fertilizer) || 0, // Ensure numbers
            pesticide: parseFloat(formData.pesticide) || 0,   // Ensure numbers
            farmArea: parseFloat(formData.area), // Use 'area' from formData
            season: formData.season
        };

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/predict_yield/', payload); // Changed endpoint
            setResult(response.data);
            if (response.data.ticker_data) {
                setTickerData(response.data.ticker_data);
            }
        } catch (err) {
            console.error("Error predicting yield:", err);
            setError("Failed to fetch prediction. Please check inputs."); // Set error message
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-900 p-6 pt-24 pb-16 relative">
            {/* Live Ticker */}
            <MarketTicker data={tickerData} />

            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Input Form */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Integrated Weather Widget */}
                    <WeatherWidget />

                    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
                        <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
                            <span className="mr-2">🌱</span> Yield Predictor
                        </h2>

                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* State Selection */}
                            <div>
                                <label className="block text-gray-400 text-sm font-semibold mb-1">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    list="state-options"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                    placeholder="Select or Type State"
                                    required
                                />
                                <datalist id="state-options">
                                    {INDIAN_STATES.map(st => <option key={st} value={st} />)}
                                </datalist>
                            </div>
                            {/* District Selection (Enabled) */}
                            <div>
                                <label className="block text-gray-400 text-sm font-semibold mb-1">District</label>
                                <input
                                    type="text"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                    placeholder="e.g. Hubballi"
                                />
                            </div>
                            {/* Crop Selection */}
                            <div>
                                <label className="block text-gray-400 text-sm font-semibold mb-1">Crop</label>
                                <input
                                    type="text"
                                    name="crop"
                                    list="crop-options"
                                    value={formData.crop}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                    placeholder="Select or Type Crop"
                                    required
                                />
                                <datalist id="crop-options">
                                    {Object.keys(dosageData).length > 0
                                        ? Object.keys(dosageData).sort().map(c => <option key={c} value={c} />)
                                        : (
                                            <>
                                                <option value="Rice" />
                                                <option value="Maize" />
                                                <option value="Wheat" />
                                                <option value="Potato" />
                                            </>
                                        )
                                    }
                                </datalist>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm font-semibold mb-1">Season</label>
                                    <select name="season" value={formData.season} onChange={handleChange} required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
                                        <option value="" disabled>Select Season</option>
                                        <option value="Kharif">Kharif</option>
                                        <option value="Rabi">Rabi</option>
                                        <option value="Summer">Summer</option>
                                        <option value="Whole Year">Whole Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-semibold mb-1">Area (Ha)</label>
                                    <input type="number" name="area" placeholder="2.5" value={formData.area} onChange={handleChange} required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm font-semibold mb-1">Fertilizer (kg)</label>
                                    <input type="number" name="fertilizer" placeholder="120" value={formData.fertilizer} onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                        step="0.01" required />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-semibold mb-1">Pesticide (kg)</label>
                                    <input type="number" name="pesticide" placeholder="30" value={formData.pesticide} onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                        step="0.01" required />
                                </div>
                            </div>

                            {autoFilled && formData.crop && dosageData[formData.crop] && (
                                <div className="space-y-4 animate-fade-in-down">
                                    {/* SMASH UI: Dynamic Recommendation */}
                                    <div className="p-4 bg-green-900/40 rounded-xl border border-green-700/50">
                                        <p className="text-sm text-green-200 leading-relaxed">
                                            For your <span className="font-bold text-white">{formData.area} Ha</span> of <span className="font-bold text-white">{formData.crop}</span> in <span className="font-bold text-white">{formData.state || "your region"}</span>, we recommend <span className="font-bold text-green-400">{dosageData[formData.crop].products}</span>
                                            {/* Dynamic State Wisdom */}
                                            {formData.state && dosageData[formData.crop].state_wisdom && dosageData[formData.crop].state_wisdom[formData.state] && (
                                                <span className="block mt-2 italic text-yellow-200 border-l-2 border-yellow-500 pl-2">
                                                    💡 {dosageData[formData.crop].state_wisdom[formData.state]}
                                                </span>
                                            )}

                                            {/* Per Hectare Reference (User Request) */}
                                            <span className="block mt-3 pt-3 border-t border-green-700/50 text-xs text-green-300 font-mono">
                                                (Reference: {dosageData[formData.crop].f_per_ha} kg Fertilizer & {dosageData[formData.crop].p_per_ha} kg Pesticide per Hectare)
                                            </span>
                                        </p>
                                    </div>

                                    {/* Guidelines Card */}
                                    <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-800/50 text-xs text-blue-200">
                                        <strong>📋 Application Guide:</strong> {dosageData[formData.crop].guidelines}
                                    </div>

                                    {/* Common Mistakes */}
                                    <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/50 text-xs text-red-300">
                                        <strong>⚠️ Things to Remember:</strong> {dosageData[formData.crop].mistakes}
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 rounded-xl shadow-lg transition-transform transform hover:scale-[1.02] mt-4 flex justify-center items-center">
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : "Predict Yield & Income"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: Results */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 animate-fade-in relative overflow-hidden">
                            {/* Background Decoration */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <span className="text-9xl">🌾</span>
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-2">Prediction Results</h2>
                            <p className="text-gray-400 mb-8 border-b border-gray-700 pb-4">
                                Based on your inputs for <span className="text-green-400 font-bold">{formData.crop}</span> in <span className="text-green-400 font-bold">{formData.state}</span>
                            </p>

                            {result.error ? (
                                <div className="text-center py-12">
                                    <p className="text-red-400 text-lg">⚠️ {result.error}</p>
                                    <p className="text-gray-500 mt-2">Please verify your inputs and try again.</p>
                                    <button onClick={() => setResult(null)} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Try Again</button>
                                </div>
                            ) : (
                                <>
                                    {/* Key Metrics Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center border-b border-gray-700 pb-8">
                                        <div>
                                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Expected Yield Rate</p>
                                            <p className="text-3xl font-bold text-yellow-400">
                                                {parseFloat(result.predicted_yield_rate).toFixed(2)} <span className="text-lg text-white font-normal">tons/ha</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Production</p>
                                            <p className="text-3xl font-bold text-yellow-400">
                                                {parseFloat(result.total_yield).toFixed(2)} <span className="text-lg text-white font-normal">tons</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Estimated Income</p>

                                            {/* Source Badge */}
                                            {result.price_source && (
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded-full border mb-1 animate-pulse ${result.price_source.includes("Actual Live") ? "bg-green-900/30 text-green-400 border-green-500/30" : "bg-yellow-900/30 text-yellow-400 border-yellow-500/30"}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${result.price_source.includes("Actual Live") ? "bg-green-500" : "bg-yellow-500"}`}></span>
                                                    <span className="text-[10px] font-bold uppercase">{result.price_source}</span>
                                                </div>
                                            )}

                                            <p className="text-3xl font-bold text-green-400">
                                                ₹ {Math.round(result.expected_income).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recommendations Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-green-400 border-l-4 border-green-500 pl-3">
                                            AI Agronomist Insights
                                        </h3>

                                        {/* Comparison Box */}
                                        <div className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-blue-500">
                                            <p className="text-gray-200 font-medium">
                                                {result.solution.comparison_text}
                                            </p>
                                        </div>

                                        {/* Detailed Text Blocks */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-700/30 p-4 rounded-xl">
                                                <h4 className="text-white font-bold mb-2">💡 Recommendation</h4>
                                                <p className="text-gray-300 text-sm leading-relaxed">{result.solution.main_advice}</p>
                                            </div>
                                            <div className="bg-gray-700/30 p-4 rounded-xl">
                                                <h4 className="text-white font-bold mb-2">📊 Market Context</h4>
                                                <p className="text-gray-300 text-sm leading-relaxed">{result.solution.msp_info}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center p-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl">
                            <span className="text-6xl mb-4 opacity-30">🚜</span>
                            <h3 className="text-xl font-bold text-gray-400 mb-2">Ready to Predict</h3>
                            <p>Enter your farm details on the left to get AI-powered yield and income estimates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}