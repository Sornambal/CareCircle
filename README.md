# CareCircle - AI Elderly Care Assistant

CareCircle is a full-stack web application designed to assist elderly users with medicine management, health tracking, and SOS alerts. The project consists of a backend API built with Node.js and Express, and a frontend React application with Material-UI components.

---

## Project Features

- **Unified Account System**: Single registration for elderly user and caregiver
- **Authentication**:
  - Caregiver login with phone and name verification
  - Elderly login-free access using device token
- **Medicine Management**:
  - Add, fetch, and mark medicines as taken
  - Automated reminders and alerts
  - Medication adherence tracking
- **Emergency Management**:
  - Emergency contacts management
  - Dual SOS alert system:
    - **Emergency SOS**: Alerts all contacts (ambulance, caretaker, relative)
    - **Family SOS**: Alerts only caretaker and relative
  - SMS notifications via Twilio
- **Dashboard & Reporting**:
  - Caregiver dashboard with recovery graphs and event logs
  - PDF report generation with visual charts and statistics
  - Real-time notifications via Socket.IO
- **Data Persistence**: MongoDB with Mongoose ODM
- **Security**: JWT authentication and data encryption middleware
- **Real-time Communication**: Socket.IO for live updates and notifications
- **Multilingual Support**: Translation utilities for multiple languages

---

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or cloud instance like MongoDB Atlas)
- **Git** (for cloning the repository)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CareCircle
```

### 2. Environment Configuration

Create environment files for both backend and frontend:

#### Backend (.env in backend/ directory)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carecircle
JWT_SECRET=your_jwt_secret_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
ENCRYPTION_KEY=your_32_character_encryption_key
```

#### Frontend (.env in frontend/ directory)
```env
REACT_APP_API_URL=http://localhost:5000
```

### 3. Backend Setup

```bash
cd backend
npm install
```

**Available Scripts:**
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

The backend server will run on `http://localhost:5000`.

### 4. Frontend Setup

Open a new terminal window/tab:

```bash
cd frontend
npm install
```

**Available Scripts:**
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

The frontend will run on `http://localhost:3000`.

### 5. Database Setup

Ensure MongoDB is running locally or configure the connection string in `backend/.env` for a remote instance.

---

## Usage Guide

### For Caregivers:
1. **Registration**: Create unified account with elderly and caregiver details
2. **Login**: Authenticate using phone number and name
3. **Management**:
   - Add and manage medicines with schedules
   - Configure emergency contacts
   - Monitor medication adherence
   - View reports and analytics
4. **Dashboard**: Access recovery graphs, event logs, and generate PDF reports

### For Elderly Users:
1. **Access**: Login-free using device token
2. **Home Screen**: View current time, medicine schedule, and SOS buttons
3. **Medication**: Mark medicines as taken when reminded
4. **Emergency**: Use SOS buttons with countdown and reject option

---

## Project Structure and Modules

### Backend (`backend/`)

- **`controllers/`**: Business logic handlers
  - `authController.js`: Authentication and user management
  - `medicineController.js`: Medicine CRUD operations
  - `emergencyContactController.js`: Contact management
  - `sosController.js`: SOS alert handling
  - `reportController.js`: PDF report generation
  - `eventController.js`: Event logging
- **`routes/`**: Express route definitions
- **`models/`**: Mongoose schemas (User, Medicine, EmergencyContact, Event, SOSLog)
- **`middleware/`**: Authentication, encryption, and validation
- **`config/`**: Database configuration
- **`utils/`**: Twilio client utilities
- **`server.js`**: Application entry point with Socket.IO integration

### Frontend (`frontend/`)

- **`src/components/`**: Reusable UI components
  - `MedicineCard.js`: Medicine display and interaction
  - `SOSButton.js`: Emergency alert triggers
  - `RecoveryGraph.js`: Adherence visualization
  - `ReportCard.js`: Report display
  - `ProfileCard.js`: User profile display
- **`src/screens/`**: Page components
  - `DashboardScreen.js`: Caregiver dashboard
  - `RegistrationScreen.js`: Account creation
  - `LoginScreen.js`: Authentication
  - `CaregiverLoginScreen.js`: Caregiver access
- **`src/hooks/`**: Custom React hooks
  - `useSocket.js`: Socket.IO connection management
  - `useMultilingualNotifications.js`: Notification handling
- **`src/utils/`**: Utilities
  - `api.js`: HTTP client configuration
  - `translations.js`: Multilingual support
- **`public/`**: Static assets and HTML template

---

## API Endpoints

### Authentication
- `POST /api/auth/register`: User registration
- `POST /api/auth/login`: Caregiver login
- `POST /api/auth/verify-token`: Token verification

### Medicine Management
- `GET /api/medicines`: Fetch medicines
- `POST /api/medicines`: Add medicine
- `PUT /api/medicines/:id/taken`: Mark as taken

### Emergency Contacts
- `GET /api/emergency-contacts`: Fetch contacts
- `POST /api/emergency-contacts`: Add contact

### SOS System
- `POST /api/sos/emergency`: Trigger emergency SOS
- `POST /api/sos/family`: Trigger family SOS

### Reports
- `GET /api/reports/adherence`: Generate adherence report

---

## Solution Flow

### Module 1: Onboarding & Setup
1. Caregiver registers unified account
2. System creates elderly device token
3. Caregiver configures medicines and emergency contacts

### Module 2: Elderly User Experience
1. Elderly accesses app with token
2. Views personalized medicine schedule
3. Receives reminders and marks medications
4. Can trigger SOS alerts with confirmation

### Module 3: Emergency Response
1. SOS trigger initiates countdown
2. User can reject false alarms
3. Confirmed alerts send SMS to contacts
4. Real-time notifications to caregiver dashboard

### Module 4: Caregiver Monitoring
1. Dashboard shows live adherence data
2. Event logs track all activities
3. Generate detailed PDF reports
4. Receive real-time SOS notifications

---

## Technologies Used

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **SMS**: Twilio API
- **PDF Generation**: jsPDF
- **Encryption**: Custom middleware
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Real-time**: Socket.IO Client
- **Build Tool**: Create React App

### Development Tools
- **Process Manager**: nodemon
- **Version Control**: Git
- **Package Manager**: npm

---

## Future Enhancements

- **Advanced Analytics**: Machine learning for adherence prediction
- **Voice Commands**: Integration with speech recognition
- **Wearable Integration**: Connect with health devices
- **Multi-language Expansion**: Additional language support
- **Offline Mode**: Local data storage for offline operation
- **Push Notifications**: Native mobile app notifications
- **Video Calling**: Emergency video communication
- **Health Metrics**: Integration with vital sign monitoring
- **Automated Refills**: Pharmacy integration for medication ordering
- **Family Network**: Multi-caregiver collaboration features

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For support, please contact the development team or create an issue in the repository.
