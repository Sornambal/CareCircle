// Removed duplicate declarations and redundant code

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

console.log('Current working directory:', process.cwd());

dotenv.config({ path: './.env' });

console.log('MONGO_URI:', process.env.MONGO_URI); // Debug log to check env variable

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const medicineRoutes = require('./routes/medicine');
const sosRoutes = require('./routes/sos');
const sosTriggerRoutes = require('./routes/sosTriggerRoutes');
const eventRoutes = require('./routes/events');
const reportRoutes = require('./routes/reports');
const emergencyContactsRoutes = require('./routes/emergencyContacts');
const twilioWebhookRoutes = require('./routes/twilioWebhookRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
// Parse application/x-www-form-urlencoded (Twilio sends callbacks as form data)
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB if a connection string is provided. If not, warn and continue
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGO_URI not set. Skipping MongoDB connection. Routes requiring a database will fail until configured.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/sos', sosTriggerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/emergency-contacts', emergencyContactsRoutes);
app.use('/api/twilio', twilioWebhookRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
