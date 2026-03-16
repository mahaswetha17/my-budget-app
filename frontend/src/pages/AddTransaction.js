import { useState } from 'react';
import axios from 'axios';

const INCOME_CATEGORIES = ['Salary', 'Pension', 'Business', 'Rent Received', 'Other Income'];
const EXPENSE_CATEGORIES = ['Groceries', 'Medical', 'Utilities', 'Transport', 'Entertainment', 'Education', 'Clothing', 'Other'];

const CATEGORY_ICONS = {
  Groceries: '🛒', Medical: '💊', Utilities: '💡', Transport: '🚌',
  Entertainment: '🎬', Education: '📚', Clothing: '👕', Salary: '💼',
  Pension: '🏛️', Business: '🏢', 'Rent Received': '🏠',
  'Other Income': '💰', Other: '📝'
};

export default function AddTransaction() {
  const [mode, setMode] = useState('smart'); // 'smart' or 'manual'
  const [type, setType] = useState('expense');

  // Smart entry
  const [smartInput, setSmartInput] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResult, setSmartResult] = useState(null);

  // Manual entry
  const [form, setForm] = useState({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg); else setMessage(msg);
    setTimeout(() => { setError(null); setMessage(null); }, 4000);
  };

  const handleSmartSubmit = async () => {
    if (!smartInput.trim()) return;
    setSmartLoading(true);
    setSmartResult(null);
    setError(null);
    try {
      const res = await axios.post('/api/transactions/smart', { input: smartInput });
      setSmartResult(res.data.transactions);
      setSmartInput('');
      showMsg(`✅ ${res.data.message}`);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Could not process. Please try again.', true);
    } finally {
      setSmartLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!form.amount || !form.category || !form.description) {
      showMsg('Please fill in all fields.', true);
      return;
    }
    try {
      await axios.post('/api/transactions', { ...form, type, amount: Number(form.amount) });
      setForm({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
      showMsg('✅ Transaction saved!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to save.', true);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="page-content">
      <p className="section-title" style={{ marginTop: '12px' }}>➕ Add Transaction</p>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`btn ${mode === 'smart' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, fontSize: '15px' }}
          onClick={() => setMode('smart')}
        >
          ✨ Smart Entry
        </button>
        <button
          className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, fontSize: '15px' }}
          onClick={() => setMode('manual')}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {mode === 'smart' ? (
        /* ---- SMART AI ENTRY ---- */
        <div>
          <div className="alert alert-info">
            ✨ Just type what you spent or earned in your own words — the AI will figure out the rest!
          </div>
          <div className="form-group">
            <label>What happened today? 💬</label>
            <textarea
              value={smartInput}
              onChange={e => setSmartInput(e.target.value)}
              placeholder='Examples:
• "Paid 500 for electricity bill and 200 for vegetables"
• "Got my salary of 25000 today"
• "Spent 350 at the medical shop for blood pressure tablets"'
              rows={5}
            />
            <p className="input-hint">You can mention multiple transactions in one sentence!</p>
          </div>
          <button
            className="btn btn-accent btn-full btn-lg"
            onClick={handleSmartSubmit}
            disabled={smartLoading || !smartInput.trim()}
          >
            {smartLoading ? '⏳ Processing...' : '✨ Save Automatically'}
          </button>

          {/* Show what AI parsed */}
          {smartResult && smartResult.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p className="section-title">✅ Saved Transactions</p>
              {smartResult.map((tx, i) => (
                <div key={i} className="card" style={{ padding: '16px', marginBottom: '10px', borderLeft: `4px solid ${tx.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>
                        {CATEGORY_ICONS[tx.category]} {tx.description}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                        {tx.category} • {tx.isAutoCategorized ? '✨ AI categorized' : 'Manual'}
                      </div>
                      {tx.smartTip && (
                        <div style={{ color: '#c87941', fontSize: '13px', marginTop: '6px', fontStyle: 'italic' }}>
                          💡 {tx.smartTip}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '20px', fontWeight: '800',
                      color: tx.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'
                    }}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---- MANUAL ENTRY ---- */
        <div>
          {/* Income / Expense toggle */}
          <div className="type-toggle">
            <button
              className={`type-btn income ${type === 'income' ? 'selected' : ''}`}
              onClick={() => { setType('income'); setForm(f => ({ ...f, category: '' })); }}
            >
              <span className="type-icon">💰</span>
              <span className="type-label">Income</span>
            </button>
            <button
              className={`type-btn expense ${type === 'expense' ? 'selected' : ''}`}
              onClick={() => { setType('expense'); setForm(f => ({ ...f, category: '' })); }}
            >
              <span className="type-icon">💸</span>
              <span className="type-label">Expense</span>
            </button>
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount e.g. 500"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              style={{ fontSize: '22px', fontWeight: '700' }}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  style={{
                    padding: '12px',
                    border: `2px solid ${form.category === cat ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    background: form.category === cat ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="e.g. Monthly groceries from market"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleManualSubmit}>
            💾 Save Transaction
          </button>
        </div>
      )}
    </div>
  );
}
