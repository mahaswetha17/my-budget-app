const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://my-budget-app-rho.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Gemini test route
app.get('/api/test-gemini', async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent('Say hello in one word');
    res.json({ success: true, response: result.response.text(), key: process.env.GEMINI_API_KEY ? 'Key exists' : 'Key missing' });
  } catch (error) {
    res.json({ success: false, error: error.message, key: process.env.GEMINI_API_KEY ? 'Key exists' : 'Key missing' });
  }
});