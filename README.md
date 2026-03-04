# HARVEST SYNC 🌾

An End-to-End AI-Powered Agricultural Ecosystem

HARVEST_SYNC is a full-stack platform designed to bridge the gap between traditional farming and modern AI. It integrates deep learning for crop health, predictive analytics for yield optimization, and a robust marketplace for transparent trade.

## Key Modules & Features

### 1. Yield Prediction Dashboard (Farmer View)

Feature: Real-time decision support displaying yield rates, expected income, and fertilizer recommendations.

Architecture: A lightweight React UI that consumes processed data from the backend ML module.

Tech: Scikit-learn / Regression Models, React Data-Viz.

Preview of the yield prediction system:

<img width="1280" height="882" alt="image" src="https://github.com/user-attachments/assets/6caad7b7-e30e-48dc-9ba5-31f778f964f0" />


### 2. Crop Health Assistant (AI Diagnosis)

Feature: End-to-end image processing pipeline where farmers upload crop photos to receive instant disease diagnosis and remedies.

Architecture: UI → Backend → AI Service (CNN/Deep Learning) → Backend → UI.

Tech: TensorFlow/PyTorch, Django REST Framework, HealthAssistant.jsx.

Preview of the health assistant

<img width="1262" height="794" alt="image" src="https://github.com/user-attachments/assets/74dab899-b6ce-4800-ac11-af72948937fa" />

### 3. Integrated Marketplace

Feature: A dual-sided marketplace for buyers and farmers with dynamic server-side filtering and order tracking.

Architecture: Strict separation of concerns. The Django API acts as a secure gateway, enforcing role-based access and data integrity.

Tech: PostgreSQL/SQLite, Django ORM, REST APIs.

Preview of the Marketplace - Buyer View: That allows buyers to view products and apply dynamic filters. Data retrieval and filtering logic are strictly handled server-side: 

<img width="902" height="510" alt="image" src="https://github.com/user-attachments/assets/8af471a7-41d9-4f4e-8244-4388b29b79e9" />

Preview of the Buyer Order History (React UI) - That dynamically renders confirmed and ongoing orders fetched via REST APIs:

<img width="902" height="477" alt="image" src="https://github.com/user-attachments/assets/813bedd1-7be2-4d19-8c36-d2f418f6d951" />

## System Architecture

The project follows a Decoupled Client-Server Architecture:

Frontend (Presentation Layer): React + Vite. Responsible for multimedia handling (image uploads), form data preparation, and real-time data visualization.

Backend (Intelligence & Logic Layer): Django. Handles all complex AI computations, database queries, and business logic to keep the client-side lightweight.

## 💻 Installation & Setup

Prerequisites

Node.js & npm

Python 3.10+

Virtual Environment (venv)

### 1. Backend Setup (Django & AI)

Navigate to the project root
cd /Users/nakul/Desktop/HARVEST_SYNC

Activate the virtual environment
source venv/bin/activate

Launch the server
cd Backend
python manage.py runserver
Backend API available at: http://127.0.0.1:8000/

### 2. Frontend Setup (React)

Open a new terminal
cd /Users/nakul/Desktop/HARVEST_SYNC/Frontend

Install dependencies (First time only)
npm install

Start development server
npm run dev
Frontend available at: http://localhost:5173/

## 👤 Contributor

### Developed by : Nakul | Third-year CS (AI) Student | Machine Learning, Data Science & Computer Vision Enthusiast
