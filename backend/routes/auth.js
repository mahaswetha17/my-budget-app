const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, monthlyBudgetGoal, preferredCurrency, age } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, password, monthlyBudgetGoal: monthlyBudgetGoal || 0, preferredCurrency: preferredCurrency || '₹', age });
    res.status(201).json({
      message: 'Account created successfully!',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, monthlyBudgetGoal: user.monthlyBudgetGoal, preferredCurrency: user.preferredCurrency }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    res.json({
      message: `Welcome back, ${user.name}!`,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, monthlyBudgetGoal: user.monthlyBudgetGoal, preferredCurrency: user.preferredCurrency }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, monthlyBudgetGoal, preferredCurrency } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, monthlyBudgetGoal, preferredCurrency }, { new: true }).select('-password');
    res.json({ message: 'Profile updated!', user });
  } catch (error) {
    res.status(500).json({ message: 'Update failed.', error: error.message });
  }
});

module.exports = router;
