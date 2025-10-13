# CareCircle - AI Elderly Care Assistant

CareCircle is a full-stack web application designed to assist elderly users with medicine management, health tracking, and SOS alerts. The project consists of a backend API built with Node.js and Express, and a frontend React application.

---

## Project Features

- Unified account registration for elderly and caregiver
- Caregiver login with phone and name authentication
- Elderly login-free access using device token
- Medicine management: add, fetch, mark as taken, with reminders and alerts
- Emergency contacts management
- Dashboard for caregivers with recovery graph, event logs, and reports
- Dual SOS alert system for elderly:
  - **Emergency SOS**: Sends alerts to all contacts (ambulance, caretaker, relative)
  - **Family SOS**: Sends alerts only to caretaker and relative
- Event logging for medication adherence and SOS events
- PDF report generation for medication adherence with visual charts and detailed statistics
- Backend API with MongoDB for data persistence
- Middleware for authentication and encryption
- SMS notifications via Twilio for SOS alerts

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

- Start the backend server:

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

- Caregiver registers unified account with elderly and caregiver details
- Caregiver logs in to manage medicines, emergency contacts, and monitor elderly
- Elderly accesses home screen with login-free token, views medicine schedule and SOS buttons
- SOS alerts include countdown with reject option
- Caregiver dashboard shows adherence reports and event logs

---

## Project Structure and Modules

### Backend (`backend/`)

- `controllers/`: Contains controller modules for handling business logic for authentication, user management, medicine management, SOS alerts, events, and reports.
- `routes/`: Defines Express routes for API endpoints corresponding to each controller.
- `models/`: Mongoose schemas and models for User, Medicine, EmergencyContact, Event, etc.
- `middleware/`: Authentication and encryption middleware.
- `config/`: Database connection configuration.
- `server.js`: Entry point for the backend server.

### Frontend (`frontend/`)

- `src/components/`: Reusable React components such as MedicineCard, ReportCard, RecoveryGraph, ProfileCard, SOSButton.
- `src/hooks/`: Custom hooks for notifications and socket connections.
- `src/screens/`: React screen components for Registration, CaregiverLogin, Home, Dashboard, etc.
- `src/utils/`: API utility functions for making HTTP requests to the backend.
- `src/App.js`: Main React app component and routing.
- `public/`: Static assets and HTML template.

---

## Solution Flow

### Module 1: Onboarding & Setup
- Unified account registration by caregiver
- Caregiver login
- System configuration for medicines and emergency contacts
- Elderly device setup with token

### Module 2: Elderly User Experience
- Login-free home screen with time, medicine schedule, SOS buttons
- Medication reminder cycle with confirmation

### Module 3: Emergency Experience
- SOS trigger with countdown with reject option
- Alert dissemination to emergency contacts

### Module 4: Caregiver Experience
- Dashboard with recovery graph, event logs, management tools
- Report generation for medication adherence

---

## Future Improvements

- Daily medicine tracker with toggle for taken/missed
- Notifications and reminders
- Helper/family connectivity features
- UI/UX enhancements and responsive design
- Comprehensive testing and performance optimization

---
