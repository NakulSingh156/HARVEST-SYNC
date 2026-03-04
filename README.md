# HARVEST_SYNC Project Setup

## Prerequisites
- Node.js & npm
- Python 3
- Virtual Environment (venv)

## Important: Start Here
All commands below assume you are inside the project folder. Run this first if you are not sure:

```bash
cd /Users/nakul/Desktop/HARVEST_SYNC
```

## 1. Backend Setup (Django)

Open a terminal and run:

```bash
# 1. Navigate to project folder
cd /Users/nakul/Desktop/HARVEST_SYNC

# 2. Activate the virtual environment
source venv/bin/activate

# 3. Navigate to Backend directory
cd Backend

# 4. Start the Django server
python manage.py runserver
```

The backend API will be available at `http://127.0.0.1:8000/`.

## 2. Frontend Setup (React + Vite)

Open a **new** terminal window and run:

```bash
# 1. Navigate to Frontend directory
cd /Users/nakul/Desktop/HARVEST_SYNC/Frontend

# 2. Install dependencies (only required for the first time)
npm install

# 3. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173/`.
