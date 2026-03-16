import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    monthlyBudgetGoal: '', preferredCurrency: '₹', age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        ...form,
        monthlyBudgetGoal: Number(form.monthlyBudgetGoal) || 0,
        age: Number(form.age) || undefined
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">💰</span>
          <h1>Create Account</h1>
          <p>Start tracking your money today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label>👤 Your Full Name</label>
          <input type="text" placeholder="e.g. Rajesh Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>📧 Email Address</label>
          <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>🔒 Password</label>
          <input type="password" placeholder="At least 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>💱 Currency</label>
          <select value={form.preferredCurrency} onChange={e => setForm(f => ({ ...f, preferredCurrency: e.target.value }))}>
            <option value="₹">₹ Indian Rupee</option>
            <option value="$">$ US Dollar</option>
            <option value="€">€ Euro</option>
            <option value="£">£ British Pound</option>
          </select>
        </div>

        <div className="form-group">
          <label>🎯 Monthly Budget Goal (optional)</label>
          <input type="number" placeholder="e.g. 20000" value={form.monthlyBudgetGoal} onChange={e => setForm(f => ({ ...f, monthlyBudgetGoal: e.target.value }))} />
          <p className="input-hint">Set a limit for your monthly spending to stay on track.</p>
        </div>

        <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Creating Account...' : '🚀 Create My Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '16px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
