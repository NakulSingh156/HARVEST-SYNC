// HARVEST-SYNC/frontend/src/HealthAssistant.jsx (Functional and Styled)

import React, { useState } from 'react';
import axios from 'axios';

// Ensure the image upload is working as planned
axios.defaults.withCredentials = true; 

const HealthAssistant = () => {
    const [image, setImage] = useState(null);
    const [diagnosis, setDiagnosis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const API_BASE_PATH = '/api/predict_disease/'; 
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file)); 
            setDiagnosis(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) return alert("Please select a leaf image first.");

        setLoading(true);
        setDiagnosis(null);
        
        // Use FormData for file uploads (REQUIRED!)
        const formData = new FormData();
        formData.append('image', image); 

        try {
            const response = await axios.post(API_BASE_PATH, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Tell Django it's a file upload
                },
            });
            
            setDiagnosis(response.data);
        } catch (error) {
            console.error('Disease Prediction Error:', error.response?.data?.error || error);
            setDiagnosis({ error: error.response?.data?.error || 'Failed to analyze image. Check server console.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-green-700">🍃 Crop Health Assistant</h2>
            <p className="text-gray-600">Upload a clear photo of a leaf to get an instant diagnosis.</p>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        required 
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    
                    {previewUrl && (
                        <img src={previewUrl} alt="Leaf Preview" 
                            className="max-w-xs h-48 mx-auto object-cover rounded-lg shadow-md border-2 border-green-500" />
                    )}
                    
                    <button type="submit" disabled={loading || !image}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition duration-200">
                        {loading ? 'Analyzing...' : 'Diagnose Leaf'}
                    </button>
                </form>
            </div>

            {diagnosis && (
                <div className="mt-6 p-4 rounded-lg shadow-lg border-l-4" 
                    style={{ borderColor: diagnosis.error ? '#f87171' : '#10b981', backgroundColor: diagnosis.error ? '#fee2e2' : '#ecfdf5' }}>
                    
                    {diagnosis.error ? (
                        <p className="text-red-700 font-medium">Error: {diagnosis.error}</p>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold">Diagnosis:</h3>
                            <p className="text-xl font-semibold mt-1" style={{ color: diagnosis.disease.includes('healthy') ? '#10b981' : '#f97316' }}>
                                {diagnosis.disease.toUpperCase()}
                            </p>
                            <p className="mt-3 text-gray-800"><strong>Remedy Advice:</strong> {diagnosis.remedy}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthAssistant;