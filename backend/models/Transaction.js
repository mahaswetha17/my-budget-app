const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },
  originalInput: { type: String },
  description: { type: String, required: true, trim: true },
  isAutoCategorized: { type: Boolean, default: false },
  smartTip: { type: String }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
