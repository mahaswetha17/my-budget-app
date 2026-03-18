const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { generateMonthlyReport, askFinanceQuestion } = require('../controllers/Geminicontroller');

const router = express.Router();
router.use(protect);

router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month ? parseInt(month) - 1 : new Date().getMonth();
    const y = year ? parseInt(year) : new Date().getFullYear();
    const transactions = await Transaction.find({ user: req.user._id, date: { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59) } });
    let totalIncome = 0, totalExpense = 0;
    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount; else totalExpense += t.amount;
      if (!categoryMap[t.category]) categoryMap[t.category] = { total: 0, count: 0, type: t.type };
      categoryMap[t.category].total += t.amount;
      categoryMap[t.category].count += 1;
    });
    const categories = Object.entries(categoryMap).map(([name, data]) => ({ category: name, total: data.total, count: data.count, type: data.type })).sort((a, b) => b.total - a.total);
    const dailyMap = {};
    transactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 };
      if (t.type === 'income') dailyMap[day].income += t.amount; else dailyMap[day].expense += t.amount;
    });
    res.json({
      period: { month: m + 1, year: y },
      summary: { totalIncome, totalExpense, netSavings: totalIncome - totalExpense, savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0 },
      categories,
      dailyData: Object.entries(dailyMap).map(([date, data]) => ({ date, ...data, balance: data.income - data.expense })),
      transactionCount: transactions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report.', error: error.message });
  }
});

router.post('/ai-summary', async (req, res) => {
  try {
    const { month, year } = req.body;
    const m = month ? parseInt(month) - 1 : new Date().getMonth();
    const y = year ? parseInt(year) : new Date().getFullYear();
    const transactions = await Transaction.find({ user: req.user._id, date: { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59) } });
    let totalIncome = 0, totalExpense = 0;
    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount; else totalExpense += t.amount;
      if (!categoryMap[t.category]) categoryMap[t.category] = 0;
      categoryMap[t.category] += t.amount;
    });
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const result = await generateMonthlyReport({
      userName: req.user.name.split(' ')[0], month: monthNames[m], year: y,
      totalIncome, totalExpense, savings: totalIncome - totalExpense,
      topCategories: Object.entries(categoryMap).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total).slice(0, 5),
      currency: req.user.preferredCurrency || '₹'
    });
    if (!result.success) return res.status(500).json({ message: result.error });
    res.json({ report: result.report });
  } catch (error) {
    res.status(500).json({ message: 'AI report failed.', error: error.message });
  }
});

router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Please enter a question.' });
    const now = new Date();
    const transactions = await Transaction.find({ user: req.user._id, date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } });
    let monthlyIncome = 0, monthlyExpense = 0;
    transactions.forEach(t => { if (t.type === 'income') monthlyIncome += t.amount; else monthlyExpense += t.amount; });
    const result = await askFinanceQuestion(question, { monthlyIncome, monthlyExpense, currency: req.user.preferredCurrency || '₹' });
    if (!result.success) return res.status(500).json({ message: result.error });
    res.json({ answer: result.answer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get answer.', error: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const [monthlyTx, todayTx] = await Promise.all([
      Transaction.find({ user: req.user._id, date: { $gte: startOfMonth } }),
      Transaction.find({ user: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } })
    ]);
    const calc = (txs) => txs.reduce((acc, t) => { if (t.type === 'income') acc.income += t.amount; else acc.expense += t.amount; return acc; }, { income: 0, expense: 0 });
    const monthly = calc(monthlyTx);
    const today = calc(todayTx);
    res.json({
      today: { ...today, balance: today.income - today.expense },
      monthly: { ...monthly, balance: monthly.income - monthly.expense, savingsRate: monthly.income > 0 ? Math.round(((monthly.income - monthly.expense) / monthly.income) * 100) : 0 },
      recentTransactions: monthlyTx.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Dashboard failed.', error: error.message });
  }
});

module.exports = router;
