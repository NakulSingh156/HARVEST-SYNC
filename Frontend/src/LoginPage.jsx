// HARVEST-SYNC/frontend/src/LoginPage.jsx (CORRECTED & UPDATED)

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// --- CRITICAL FIX 1: Tell Axios to include cookies (credentials) ---
axios.defaults.withCredentials = true;
// ------------------------------------------------------------------

const LoginPage = () => {
    // 1. ADD 'role' to initial state (Default to Farmer 'F')
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'F'
    });

    const [isRegistering, setIsRegistering] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth(); // Get the login function from context

    const handleChange = (e) => {
        // Handle all input fields and the new select field
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- LOGISTICS UPGRADE ---
    const [farmers, setFarmers] = useState([]);
    const [locationStatus, setLocationStatus] = useState('pending');

    React.useEffect(() => {
        // 1. Capture Location if registering
        if (isRegistering) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setFormData(prev => ({
                            ...prev,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }));
                        setLocationStatus('success');
                    },
                    (error) => {
                        console.error("Location error:", error);
                        setLocationStatus('error');
                    }
                );
            }
        }

        // 2. Fetch Farmers for Dropdown if Role is Logistics
        if (isRegistering && formData.role === 'L') {
            const fetchFarmers = async () => {
                try {
                    // Use existing marketplace API to find farmers for now
                    // In production, use dedicated /api/farmers/ endpoint
                    const response = await axios.get('/api/listings/');
                    // Extract unique farmers from listings
                    const uniqueFarmers = [];
                    const map = new Map();
                    for (const item of response.data) {
                        if (!map.has(item.farmer_id)) {
                            map.set(item.farmer_id, true);
                            uniqueFarmers.push({
                                id: item.farmer_id,
                                username: item.farmer_name,
                                farm_name: item.farmer_city // hacking farm name/city for display
                            });
                        }
                    }
                    setFarmers(uniqueFarmers);
                } catch (err) {
                    console.error("Failed to load farmers", err);
                }
            }
            fetchFarmers();
        }
    }, [isRegistering, formData.role]);
    // -------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Use simple relative endpoint path for Vite proxy
        const endpoint = isRegistering ? '/api/register/' : '/api/login/';

        try {
            // --- CRITICAL FIX: Removed duplicate post and hardcoded base URL ---
            const response = await axios.post(endpoint, formData);
            // -------------------------------------------------------------------

            if (response.status === 201 || response.status === 200) {
                setMessage(response.data.message);

                if (!isRegistering) {
                    // --- LOGIN SUCCESS LOGIC ---
                    const userRole = response.data.role; // GET ROLE CODE FROM DJANGO RESPONSE
                    login(formData.username, userRole); // PASS ROLE TO GLOBAL CONTEXT
                    alert(`Welcome, ${formData.username}! Role: ${userRole}`);

                    // DYNAMIC ROLE-BASED REDIRECTION
                    if (userRole === 'B') {
                        navigate('/buyer-dashboard');
                    } else if (userRole === 'L') {
                        navigate('/logistics-dashboard');
                    } else {
                        navigate('/dashboard'); // Default is Farmer
                    }
                } else {
                    // After register, switch to login view
                    setIsRegistering(false);
                }
            }
        } catch (error) {
            console.error('Auth Error:', error.response?.data || error);
            // Check for specific 401 (Unauthorized) errors from Django
            setMessage(error.response?.data?.error || 'Connection failed.');
        } finally {
            setLoading(false);
        }
    };

    // HARVEST-SYNC/frontend/src/LoginPage.jsx (Partial View)

    // ... inside the return block ...

    return (
        // Start of the main return block
        <div className="flex justify-center items-center min-h-screen bg-gray-900/90">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-center">

                <h1 className="text-4xl font-extrabold text-green-400 mb-6 tracking-wide">
                    HARVEST-SYNC
                </h1>
                <h2 className="text-xl text-gray-300 mb-6">
                    {isRegistering ? 'Register New User' : 'Login'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Input Fields */}
                    <input
                        name="username"
                        type="text"
                        placeholder="Username"
                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    {/* Role Select Field */}
                    {isRegistering && (
                        <div className="space-y-4">
                            <select name="role" value={formData.role} onChange={handleChange} required
                                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="F">Register as Farmer</option>
                                <option value="B">Register as Buyer/Customer</option>
                                <option value="L">Register as Logistics Agent</option>
                            </select>

                            {/* Extra Fields for Farmers */}
                            {formData.role === 'F' && (
                                <div className="space-y-3 pl-2 border-l-2 border-green-600 animate-fade-in-down">
                                    <input
                                        name="farm_name"
                                        type="text"
                                        placeholder="Farm Name (e.g. Green Acres)"
                                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                                        onChange={handleChange}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            name="age"
                                            type="number"
                                            placeholder="Age"
                                            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                                            onChange={handleChange}
                                        />
                                        <input
                                            name="city"
                                            type="text"
                                            placeholder="City/Village"
                                            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <select
                                        name="farm_type"
                                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 text-sm"
                                        onChange={handleChange}
                                    >
                                        <option value="Family">Family Farm</option>
                                        <option value="Private">Private Farm</option>
                                        <option value="Govt">Govt Subsidized</option>
                                        <option value="Cooperative">Co-operative</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}

                            {/* Extra Fields for Logistics Agent */}
                            {formData.role === 'L' && (
                                <div className="space-y-3 pl-2 border-l-2 border-blue-600 animate-fade-in-down">
                                    <p className="text-sm text-gray-400 mb-1">Select the Farmer you work for:</p>
                                    <select
                                        name="serviced_farmer_id"
                                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm"
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">-- Select Farmer --</option>
                                        {/* Ideally fetch from API, hardcoding 2 for demo if not fetched */}
                                        <option value="1">Farmer John (Demo)</option>
                                        {farmers.map(f => (
                                            <option key={f.id} value={f.id}>{f.username} - {f.farm_name}</option>
                                        ))}
                                    </select>

                                    {/* Location Auto-Capture */}
                                    <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                                        {locationStatus === 'success' ? (
                                            <span className="text-green-500">📍 Location Captured: {formData.latitude}, {formData.longitude}</span>
                                        ) : (
                                            <span className="text-yellow-500">📍 Accessing Location... (Required for routing)</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
                        {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                    </button>
                </form>

                {/* Message and Switch Button */}
                <p className="text-sm mt-4" style={{ color: message.includes('successful') ? '#34d399' : '#f87171' }}>{message}</p>

                <button onClick={() => setIsRegistering(!isRegistering)}
                    className="mt-4 text-sm text-green-400 hover:text-green-300 transition duration-150"
                >
                    {isRegistering ? 'Already a user? Login' : 'New user? Register'}
                </button>
            </div>
        </div>
        // End of the main return block
    );
};

export default LoginPage;