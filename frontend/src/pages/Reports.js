import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82a0', '#4a9e8a', '#e88c4a', '#d9534f', '#7b68c8', '#4db8c2', '#e8c14a', '#a0c878'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    setAiReport('');
    try {
      const res = await axios.post('/api/reports/ai-summary', { month: selectedMonth, year: selectedYear });
      setAiReport(res.data.report);
    } catch {
      setAiReport('Could not generate report. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="spinner"></div>
    </div>
  );

  const expenseCategories = report?.categories?.filter(c => c.type === 'expense') || [];
  const pieData = expenseCategories.slice(0, 7);

  return (
    <div className="page-content">
      <p className="section-title" style={{ marginTop: '12px' }}>📊 Monthly Reports</p>

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{ flex: 1 }}
        >
          {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          style={{ width: '110px' }}
        >
          {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
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
            <div className="progress-fill" style={{
              width: `${Math.min(report?.summary?.savingsRate || 0, 100)}%`,
              background: 'var(--accent)'
            }} />
          </div>
        </div>
      </div>

      {/* Pie chart - expense breakdown */}
      {pieData.length > 0 && (
        <div className="card">
          <p className="section-title">🥧 Where Your Money Went</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmtMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar chart - daily spending */}
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
              <span style={{
                fontWeight: '800', fontSize: '16px',
                color: cat.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'
              }}>
                {cat.type === 'income' ? '+' : '-'}{fmtMoney(cat.total)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* AI Monthly Report */}
      <div className="ai-box">
        <div className="ai-box-title">🤖 AI Monthly Analysis</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '12px' }}>
          Get a personalized summary of your {MONTH_NAMES[selectedMonth - 1]} spending with smart saving tips!
        </p>
        <button
          className="btn btn-primary btn-full"
          onClick={generateAIReport}
          disabled={aiLoading}
        >
          {aiLoading ? '⏳ Generating your report...' : '✨ Generate My Report'}
        </button>
        {aiReport && <div className="ai-response">{aiReport}</div>}
      </div>

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="card">
          <p className="section-title">🧾 All Transactions ({transactions.length})</p>
          {transactions.map(tx => (
            <div key={tx._id} className="tx-item">
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
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}{fmtMoney(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
