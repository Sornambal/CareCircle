// Removed duplicate declarations and redundant code

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

console.log('Current working directory:', process.cwd());

dotenv.config({ path: './.env' });

console.log('MONGO_URI:', process.env.MONGO_URI); // Debug log to check env variable

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const medicineRoutes = require('./routes/medicine');
const sosRoutes = require('./routes/sos');
const eventRoutes = require('./routes/events');
const reportRoutes = require('./routes/reports');


const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
