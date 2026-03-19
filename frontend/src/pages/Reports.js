import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82a0', '#4a9e8a', '#e88c4a', '#d9534f', '#7b68c8', '#4db8c2', '#e8c14a', '#a0c878'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const INCOME_CATS = ['Salary','Pension','Business','Rent Received','Other Income'];
const EXPENSE_CATS = ['Groceries','Medical','Utilities','Transport','Entertainment','Education','Clothing','Other'];

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.preferredCurrency || '₹';
  const fmtMoney = (n) => `${currency}${(n || 0).toLocaleString('en-IN')}`;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [editTx, setEditTx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => { fetchReport(); }, [selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [rpt, txs] = await Promise.all([
        axios.get(`/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`),
        axios.get(`/api/transactions?startDate=${selectedYear}-${String(selectedMonth).padStart(2,'0')}-01&endDate=${selectedYear}-${String(selectedMonth).padStart(2,'0')}-31&limit=50`)
      ]);
      setReport(rpt.data);
      setTransactions(txs.data.transactions);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    setAiReport('');
    try {
      const res = await axios.post('/api/reports/ai-summary', { month: selectedMonth, year: selectedYear });
      setAiReport(res.data.report);
    } catch { setAiReport('Could not generate report. Please try again.'); }
    finally { setAiLoading(false); }
  };

  const openEdit = (tx) => {
    setEditTx(tx);
    setEditForm({
      type: tx.type, amount: tx.amount, category: tx.category,
      description: tx.description,
      date: new Date(tx.date).toISOString().split('T')[0]
    });
  };

  const saveEdit = async () => {
    try {
      await axios.put(`/api/transactions/${editTx._id}`, editForm);
      setMessage('✅ Transaction updated!');
      setEditTx(null);
      fetchReport();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Update failed.'); }
  };

  const deleteTx = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      setMessage('✅ Deleted!');
      fetchReport();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Delete failed.'); }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="spinner"></div>
    </div>
  );

  const expenseCategories = report?.categories?.filter(c => c.type === 'expense') || [];
  const categories = editForm.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="page-content">
      <p className="section-title" style={{ marginTop: '12px' }}>📊 Monthly Reports</p>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>
      )}

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ flex: 1 }}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: '110px' }}>
          {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="stat-grid">
        <div className="stat-card income">
          <span className="stat-label">Total Income</span>
          <span className="stat-value">{fmtMoney(report?.summary?.totalIncome)}</span>
        </div>
        <div className="stat-card expense">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value">{fmtMoney(report?.summary?.totalExpense)}</span>
        </div>
        <div className="stat-card balance" style={{ gridColumn: '1/-1' }}>
          <span className="stat-label">Net Savings</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-value">{fmtMoney(report?.summary?.netSavings)}</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>
              {report?.summary?.savingsRate}% saved
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(report?.summary?.savingsRate || 0, 100)}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Pie chart */}
      {expenseCategories.length > 0 && (
        <div className="card">
          <p className="section-title">🥧 Where Your Money Went</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={expenseCategories.slice(0,7)} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90}
                label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {expenseCategories.slice(0,7).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmtMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar chart */}
      {report?.dailyData?.length > 0 && (
        <div className="card">
          <p className="section-title">📈 Daily Spending</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={report.dailyData.slice(-14)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmtMoney(v)} />
              <Bar dataKey="expense" name="Spent" fill="var(--expense-color)" radius={[4,4,0,0]} />
              <Bar dataKey="income" name="Earned" fill="var(--income-color)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      <div className="card">
        <p className="section-title">🏷️ Category Breakdown</p>
        {report?.categories?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No transactions this month.</p>
        ) : (
          report?.categories?.map((cat, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--bg-subtle)' }}>
              <div>
                <span style={{ fontWeight: '700' }}>{cat.category}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>{cat.count} transactions</span>
              </div>
              <span style={{ fontWeight: '800', fontSize: '16px', color: cat.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)' }}>
                {cat.type === 'income' ? '+' : '-'}{fmtMoney(cat.total)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* AI Report */}
      <div className="ai-box">
        <div className="ai-box-title">🤖 AI Monthly Analysis</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '12px' }}>
          Get a personalized summary of your {MONTH_NAMES[selectedMonth - 1]} spending with smart saving tips!
        </p>
        <button className="btn btn-primary btn-full" onClick={generateAIReport} disabled={aiLoading}>
          {aiLoading ? '⏳ Generating your report...' : '✨ Generate My Report'}
        </button>
        {aiReport && <div className="ai-response">{aiReport}</div>}
      </div>

      {/* All Transactions with Edit/Delete */}
      {transactions.length > 0 && (
        <div className="card">
          <p className="section-title">🧾 All Transactions ({transactions.length})</p>
          {transactions.map(tx => (
            <div key={tx._id} className="tx-item" style={{ alignItems: 'flex-start' }}>
              <div className={`tx-icon ${tx.type}`}>
                {tx.type === 'income' ? '💰' : '💸'}
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
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTx && (
        <>
          <div onClick={() => setEditTx(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px 20px', zIndex: 500, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p className="section-title" style={{ margin: 0 }}>✏️ Edit Transaction</p>
              <button onClick={() => setEditTx(null)} style={{ background: 'var(--bg-subtle)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {['income', 'expense'].map(t => (
                <button key={t} onClick={() => setEditForm(f => ({ ...f, type: t, category: '' }))}
                  style={{
                    padding: '14px', border: `2px solid ${editForm.type === t ? (t === 'income' ? 'var(--income-color)' : 'var(--expense-color)') : 'var(--border)'}`,
                    borderRadius: '10px', cursor: 'pointer',
                    background: editForm.type === t ? (t === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)') : 'white',
                    fontFamily: 'var(--font-body)', fontWeight: '700', fontSize: '15px'
                  }}
                >{t === 'income' ? '💰 Income' : '💸 Expense'}</button>
              ))}
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} style={{ fontSize: '20px', fontWeight: '700' }} />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-outline" onClick={() => setEditTx(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>💾 Save Changes</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}