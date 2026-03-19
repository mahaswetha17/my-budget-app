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

// Test Llama via Groq
app.get('/api/test-ai', async (req, res) => {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      max_tokens: 10
    });
    res.json({
      success: true,
      response: completion.choices[0].message.content,
      key: process.env.GROQ_API_KEY ? 'Groq key exists' : 'Groq key missing'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      key: process.env.GROQ_API_KEY ? 'Groq key exists' : 'Groq key missing'
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));