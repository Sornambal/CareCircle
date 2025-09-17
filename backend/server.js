const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config({ path: '../.env' });

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/medicines', require('./routes/medicine'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/sos', require('./routes/sos'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
