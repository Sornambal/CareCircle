# CareCircle - AI Elderly Care Assistant

CareCircle is a full-stack web application designed to assist elderly users with medicine management, health tracking, SOS alerts, and companionship through a chatbot. The project consists of a backend API built with Node.js and Express, and a frontend React application.

---

## Project Features

- User registration and login with JWT authentication
- Medicine management: add, fetch, mark as taken, and OCR prescription scanning
- Dashboard with user profile, medicine list, adherence reports, and daily medicine taken status
- SOS alert system with location (mocked)
- Chatbot for companionship and assistance
- Backend API with MongoDB for data persistence
- Middleware for authentication and encryption

---

## Prerequisites

- Node.js (v14 or higher recommended)
- npm (comes with Node.js)
- MongoDB (local or remote instance)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CareCircle
```

### 2. Backend Setup

```bash
cd backend
npm install
```



```bash
npm start
```

The backend server will run on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal window/tab:

```bash
cd frontend
npm install
```

- Start the frontend development server:

```bash
npm start
```

The frontend will run on `http://localhost:3000`.

---

## Usage

- Register a new user or login with existing credentials.
- Use the dashboard to add medicines, view adherence reports, and track medicine intake.
- Send SOS alerts in emergencies.
- Chat with the AI-powered chatbot for companionship.

---

## Project Structure and Modules

### Backend (`backend/`)

- `controllers/`: Contains controller modules for handling business logic for authentication, user management, medicine management, chatbot interactions, and SOS alerts.
- `routes/`: Defines Express routes for API endpoints corresponding to each controller.
- `models/`: Mongoose schemas and models for User, Medicine, Conversation, etc.
- `middleware/`: Authentication and encryption middleware.
- `config/`: Database connection configuration.
- `server.js`: Entry point for the backend server.

### Frontend (`frontend/`)

- `src/components/`: Reusable React components such as MedicineCard, ReportCard, RecoveryGraph, ProfileCard, SOSButton.
- `src/screens/`: React screen components for Dashboard, Registration, Login, Chatbot, etc.
- `src/utils/`: API utility functions for making HTTP requests to the backend.
- `src/App.js`: Main React app component and routing.
- `public/`: Static assets and HTML template.

---

## Future Improvements

- Daily medicine tracker with toggle for taken/missed
- Notifications and reminders
- Enhanced chatbot AI capabilities
- Helper/family connectivity features
- UI/UX enhancements and responsive design
- Comprehensive testing and performance optimization

---


