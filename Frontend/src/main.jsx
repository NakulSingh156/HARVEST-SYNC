// HARVEST_SYNC/frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// CRITICAL: Ensure you import your main CSS file
import './index.css'; 
import { AuthProvider } from './AuthContext.jsx'; // <-- Import the provider
// ... (rest of the file)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- WRAP THE ENTIRE APP HERE */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)