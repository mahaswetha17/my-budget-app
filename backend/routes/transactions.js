const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { parseNaturalLanguageTransaction } = require('../controllers/geminiController_final');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, type, limit = 20, page = 1 } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const transactions = await Transaction.find(query).sort({ date: -1 }).limit(Number(limit)).skip((page - 1) * limit);
    const total = await Transaction.countDocuments(query);
    res.json({ transactions, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions.', error: error.message });
  }
});

router.get('/today', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const transactions = await Transaction.find({ user: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } }).sort({ date: -1 });
    const summary = transactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount; else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
    res.json({ transactions, summary: { ...summary, balance: summary.income - summary.expense } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch today data.', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    if (!type || !amount || !category || !description) return res.status(400).json({ message: 'Please fill in all required fields.' });
    const transaction = await Transaction.create({ user: req.user._id, type, amount, category, description, date: date || Date.now() });
    res.status(201).json({ message: 'Transaction added!', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save transaction.', error: error.message });
  }
});

router.post('/smart', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input || input.trim().length < 3) return res.status(400).json({ message: 'Please describe what you spent or earned.' });
    const parsed = await parseNaturalLanguageTransaction(input);
    if (!parsed.success) return res.status(422).json({ message: parsed.error });
    if (!parsed.transactions || parsed.transactions.length === 0) return res.status(422).json({ message: 'Could not find any amounts. Please mention a number.' });
    const saved = await Transaction.insertMany(parsed.transactions.map(t => ({
      user: req.user._id, type: t.type, amount: t.amount, category: t.category,
      description: t.description, originalInput: input, isAutoCategorized: true,
      smartTip: t.smartTip || null, date: Date.now()
    })));
    res.status(201).json({ message: `${saved.length} transaction(s) added!`, transactions: saved });
  } catch (error) {
    res.status(500).json({ message: 'Smart entry failed.', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    const updated = await Transaction.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
    res.json({ message: 'Transaction updated!', transaction: updated });
  } catch (error) {
    res.status(500).json({ message: 'Update failed.', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed.', error: error.message });
  }
});

module.exports = router;
