import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_ICONS } from '../components/Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');

  const currency = user?.preferredCurrency || '₹';
  const fmtMoney = (n) => `${currency}${(n || 0).toLocaleString('en-IN')}`;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = user?.name?.split(' ')[0] || 'Friend';

  const INCOME_CATS = ['Salary','Pension','Business','Rent Received','Other Income'];
  const EXPENSE_CATS = ['Groceries','Medical','Utilities','Transport','Entertainment','Education','Clothing','Other'];

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/reports/dashboard');
      setDashboard(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await axios.post('/api/reports/ask', { question: aiQuestion });
      setAiAnswer(res.data.answer);
    } catch { setAiAnswer('Sorry, I could not answer right now. Please try again.'); }
    finally { setAiLoading(false); }
  };

  const openEdit = (tx) => {
    setEditTx(tx);
    setEditForm({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
      date: new Date(tx.date).toISOString().split('T')[0]
    });
  };

  const saveEdit = async () => {
    try {
      await axios.put(`/api/transactions/${editTx._id}`, editForm);
      setMessage('✅ Transaction updated!');
      setEditTx(null);
      fetchDashboard();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Update failed. Try again.'); }
  };

  const deleteTx = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      setMessage('✅ Transaction deleted!');
      fetchDashboard();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Delete failed. Try again.'); }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="spinner"></div>
    </div>
  );

  const d = dashboard;
  const categories = editForm.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <>
      <div className="page-header">
        <div className="greeting">Good day, <span>{firstName}</span> 👋</div>
        <div className="date-label">{today}</div>
      </div>

      <div className="page-content">
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        {/* Today's Summary */}
        <p className="section-title">📅 Today's Summary</p>
        <div className="stat-grid">
          <div className="stat-card income">
            <span className="stat-label">Earned</span>
            <span className="stat-value">{fmtMoney(d?.today?.income)}</span>
          </div>
          <div className="stat-card expense">
            <span className="stat-label">Spent</span>
            <span className="stat-value">{fmtMoney(d?.today?.expense)}</span>
          </div>
        </div>

        {/* Monthly Summary */}
        <p className="section-title">🗓️ This Month</p>
        <div className="stat-grid">
          <div className="stat-card income">
            <span className="stat-label">Income</span>
            <span className="stat-value">{fmtMoney(d?.monthly?.income)}</span>
          </div>
          <div className="stat-card expense">
            <span className="stat-label">Expenses</span>
            <span className="stat-value">{fmtMoney(d?.monthly?.expense)}</span>
          </div>
          <div className="stat-card balance" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-label">💰 Net Savings</span>
            <span className="stat-value">{fmtMoney(d?.monthly?.balance)}</span>
            {d?.monthly?.savingsRate > 0 && (
              <span style={{ fontSize: '14px', color: 'var(--primary-dark)', fontWeight: '700' }}>
                You saved {d.monthly.savingsRate}% of your income! 🎉
              </span>
            )}
          </div>
        </div>

        {/* Budget goal */}
        {user?.monthlyBudgetGoal > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700' }}>Monthly Budget</span>
              <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                {fmtMoney(d?.monthly?.expense)} / {fmtMoney(user.monthlyBudgetGoal)}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min((d?.monthly?.expense / user.monthlyBudgetGoal) * 100, 100)}%`,
                background: d?.monthly?.expense > user.monthlyBudgetGoal ? 'var(--expense-color)' : 'var(--accent)'
              }} />
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <p className="section-title">🕐 Recent Activity</p>
        <div className="card">
          {d?.recentTransactions?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No transactions yet. Tap <strong>Add</strong> to get started!
            </p>
          ) : (
            d?.recentTransactions?.map(tx => (
              <div key={tx._id} className="tx-item" style={{ alignItems: 'flex-start' }}>
                <div className={`tx-icon ${tx.type}`}>
                  {CATEGORY_ICONS[tx.category] || '📝'}
                </div>
                <div className="tx-info">
                  <div className="tx-desc">{tx.description}</div>
                  <div className="tx-meta">
                    <span className="tx-badge">{tx.category}</span>
                    <span>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmtMoney(tx.amount)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEdit(tx)}
                      style={{
                        padding: '4px 10px', border: '1px solid var(--primary)',
                        borderRadius: '6px', background: 'var(--primary-light)',
                        color: 'var(--primary)', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '700'
                      }}
                    >✏️ Edit</button>
                    <button
                      onClick={() => deleteTx(tx._id)}
                      style={{
                        padding: '4px 10px', border: '1px solid var(--expense-color)',
                        borderRadius: '6px', background: 'var(--expense-bg)',
                        color: 'var(--expense-color)', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '700'
                      }}
                    >🗑️</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Assistant */}
        <div className="ai-box">
          <div className="ai-box-title">🤖 Ask Your Finance Helper</div>
          <textarea
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            placeholder="Ask anything... e.g., 'How can I save more on groceries?'"
            rows={3}
            style={{ marginBottom: '10px' }}
          />
          <button className="btn btn-primary btn-full" onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}>
            {aiLoading ? '⏳ Thinking...' : '💬 Get Advice'}
          </button>
          {aiAnswer && <div className="ai-response">{aiAnswer}</div>}
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editTx && (
        <>
          <div
            onClick={() => setEditTx(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 400
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px 20px', zIndex: 500,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p className="section-title" style={{ margin: 0 }}>✏️ Edit Transaction</p>
              <button
                onClick={() => setEditTx(null)}
                style={{
                  background: 'var(--bg-subtle)', border: 'none',
                  width: '32px', height: '32px', borderRadius: '50%',
                  cursor: 'pointer', fontSize: '16px'
                }}
              >✕</button>
            </div>

            {/* Type toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {['income', 'expense'].map(t => (
                <button
                  key={t}
                  onClick={() => setEditForm(f => ({ ...f, type: t, category: '' }))}
                  style={{
                    padding: '14px', border: `2px solid ${editForm.type === t ? (t === 'income' ? 'var(--income-color)' : 'var(--expense-color)') : 'var(--border)'}`,
                    borderRadius: '10px', cursor: 'pointer',
                    background: editForm.type === t ? (t === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)') : 'white',
                    fontFamily: 'var(--font-body)', fontWeight: '700', fontSize: '15px'
                  }}
                >
                  {t === 'income' ? '💰 Income' : '💸 Expense'}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                style={{ fontSize: '20px', fontWeight: '700' }}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={editForm.category}
                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-outline" onClick={() => setEditTx(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>💾 Save Changes</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}