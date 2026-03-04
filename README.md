#HARVEST_SYNC 🌾

An End-to-End AI-Powered Agricultural Ecosystem

HARVEST_SYNC is a full-stack platform designed to bridge the gap between traditional farming and modern AI. It integrates deep learning for crop health, predictive analytics for yield optimization, and a robust marketplace for transparent trade.

##Key Modules & Features

###1. Yield Prediction Dashboard (Farmer View)

Feature: Real-time decision support displaying yield rates, expected income, and fertilizer recommendations.

Architecture: A lightweight React UI that consumes processed data from the backend ML module.

Tech: Scikit-learn / Regression Models, React Data-Viz.

###2. Crop Health Assistant (AI Diagnosis)

Feature: End-to-end image processing pipeline where farmers upload crop photos to receive instant disease diagnosis and remedies.

Architecture: UI → Backend → AI Service (CNN/Deep Learning) → Backend → UI.

Tech: TensorFlow/PyTorch, Django REST Framework, HealthAssistant.jsx.

###3. Integrated Marketplace

Feature: A dual-sided marketplace for buyers and farmers with dynamic server-side filtering and order tracking.

Architecture: Strict separation of concerns. The Django API acts as a secure gateway, enforcing role-based access and data integrity.

Tech: PostgreSQL/SQLite, Django ORM, REST APIs.

System Architecture
The project follows a Decoupled Client-Server Architecture:

Frontend (Presentation Layer): React + Vite. Responsible for multimedia handling (image uploads), form data preparation, and real-time data visualization.

Backend (Intelligence & Logic Layer): Django. Handles all complex AI computations, database queries, and business logic to keep the client-side lightweight.

##💻 Installation & Setup

Prerequisites

Node.js & npm

Python 3.10+

Virtual Environment (venv)

###1. Backend Setup (Django & AI)

Navigate to the project root
cd /Users/nakul/Desktop/HARVEST_SYNC

Activate the virtual environment
source venv/bin/activate

Launch the server
cd Backend
python manage.py runserver
Backend API available at: http://127.0.0.1:8000/

###2. Frontend Setup (React)

Open a new terminal
cd /Users/nakul/Desktop/HARVEST_SYNC/Frontend

Install dependencies (First time only)
npm install

Start development server
npm run dev
Frontend available at: http://localhost:5173/

##Project Structure

HARVEST_SYNC/
├── Backend/                 # Django Project (ML Models, APIs, Logic)
│   ├── PredictYieldAPI/     # Yield Intelligence Layer
│   ├── CropHealth/          # Deep Learning Image Processing
│   └── Marketplace/         # Trade & Order Management
├── Frontend/                # React Vite Project
│   └── src/components/      # HealthAssistant.jsx, Dashboard, etc.
└── venv/                    # Python Virtual Environment
Developed by [Nakul] Third-year CS (AI) Student | Machine Learning & Computer Vision Enthusiast
