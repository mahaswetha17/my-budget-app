import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_ICONS } from '../components/Layout';

const CURRENCY_SYMBOL = { '₹': '₹', '$': '$', '€': '€', '£': '£', '¥': '¥' };

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const currency = user?.preferredCurrency || '₹';

  const fmtMoney = (n) => `${currency}${(n || 0).toLocaleString('en-IN')}`;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/reports/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await axios.post('/api/reports/ask', { question: aiQuestion });
      setAiAnswer(res.data.answer);
    } catch (err) {
      setAiAnswer('Sorry, I could not answer right now. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="spinner"></div>
    </div>
  );

  const d = dashboard;
  const firstName = user?.name?.split(' ')[0] || 'Friend';

  return (
    <>
      <div className="page-header">
        <div className="greeting">Good day, <span>{firstName}</span> 👋</div>
        <div className="date-label">{today}</div>
      </div>

      <div className="page-content">

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

        {/* Budget goal progress */}
        {user?.monthlyBudgetGoal > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700' }}>Monthly Budget</span>
              <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                {fmtMoney(d?.monthly?.expense)} / {fmtMoney(user.monthlyBudgetGoal)}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min((d?.monthly?.expense / user.monthlyBudgetGoal) * 100, 100)}%`,
                  background: d?.monthly?.expense > user.monthlyBudgetGoal ? 'var(--expense-color)' : 'var(--accent)'
                }}
              />
            </div>
            {d?.monthly?.expense > user.monthlyBudgetGoal && (
              <p style={{ color: 'var(--expense-color)', fontWeight: '700', marginTop: '8px', fontSize: '14px' }}>
                ⚠️ Over budget by {fmtMoney(d.monthly.expense - user.monthlyBudgetGoal)}
              </p>
            )}
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
              <div key={tx._id} className="tx-item">
                <div className={`tx-icon ${tx.type}`}>
                  {CATEGORY_ICONS[tx.category] || '📝'}
                </div>
                <div className="tx-info">
                  <div className="tx-desc">{tx.description}</div>
                  <div className="tx-meta">
                    <span className="tx-badge">{tx.category}</span>
                    {tx.isAutoCategorized && <span className="tx-badge ai">✨ AI</span>}
                    <span>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {tx.smartTip && (
                    <div style={{ fontSize: '13px', color: '#c87941', marginTop: '4px', fontStyle: 'italic' }}>
                      💡 {tx.smartTip}
                    </div>
                  )}
                </div>
                <div className={`tx-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmtMoney(tx.amount)}
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
            placeholder="Ask anything... e.g., 'How can I save more on groceries?' or 'Am I spending too much?'"
            rows={3}
            style={{ marginBottom: '10px' }}
          />
          <button
            className="btn btn-primary btn-full"
            onClick={askAI}
            disabled={aiLoading || !aiQuestion.trim()}
          >
            {aiLoading ? '⏳ Thinking...' : '💬 Get Advice'}
          </button>
          {aiAnswer && (
            <div className="ai-response">{aiAnswer}</div>
          )}
        </div>
      </div>
    </>
  );
}
