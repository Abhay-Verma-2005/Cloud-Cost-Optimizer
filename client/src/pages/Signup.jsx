import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const errorMessages = {
    username: {
      min: 'Username must be at least 3 characters',
      max: 'Username must be less than 20 characters',
      pattern: 'Username can only contain letters, numbers, and underscores'
    },
    password: {
      min: 'Password must be at least 6 characters',
      max: 'Password is too long'
    },
    confirmPassword: {
      empty: 'Please confirm your password',
      mismatch: 'Passwords do not match'
    },
    email: {
      empty: 'Email is required',
      invalid: 'Please enter a valid email address'
    }
  };

  const validateField = (field, value) => {
    let error = '';

    switch (field) {
      case 'username':
        if (value.length < 3) error = errorMessages.username.min;
        else if (value.length > 20) error = errorMessages.username.max;
        else if (!/^\w+$/.test(value)) error = errorMessages.username.pattern;
        break;
      case 'password':
        if (value.length < 6) error = errorMessages.password.min;
        else if (value.length > 100) error = errorMessages.password.max;
        break;
      case 'confirmPassword':
        if (!value) error = errorMessages.confirmPassword.empty;
        else if (value !== formData.password) error = errorMessages.confirmPassword.mismatch;
        break;
      case 'email':
        if (!value) error = errorMessages.email.empty;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = errorMessages.email.invalid;
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value.trim());
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field].trim());
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const data = await api.signup(
        formData.username.trim(),
        formData.password,
        formData.email.trim()
      );

      if (data.success) {
        setSuccessMessage('Account created successfully! Redirecting to login...');
        setFormData({ username: '', password: '', confirmPassword: '', email: '' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const err = data.error || data.message || 'Signup failed';
        if (err.toLowerCase().includes('username')) {
          setErrors(prev => ({ ...prev, username: err }));
        } else if (err.toLowerCase().includes('password')) {
          setErrors(prev => ({ ...prev, password: err }));
        } else {
          alert('Signup failed: ' + err);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Network error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="header" style={{ padding: '8px 20px' }}>
        <h1>
          <img src="/logo-a.png" alt="CostInsight Logo" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain', marginRight: '10px', verticalAlign: 'middle' }} />
          CostInsight
        </h1>
        <p>Create Your Account</p>
      </div>
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#F8F8F8',
        padding: '20px'
      }}>
        <div className="card" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h2>Create Account</h2>
          <p>Join CostInsight to optimize your AWS costs</p>

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.username && (
                <div style={{ color: '#C7511F', fontSize: '13px', marginTop: '5px', fontWeight: 500 }}>
                  {errors.username}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span style={{ color: '#C7511F' }}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.email && (
                <div style={{ color: '#C7511F', fontSize: '13px', marginTop: '5px', fontWeight: 500 }}>
                  {errors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter a secure password (min. 6 characters)"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.password && (
                <div style={{ color: '#C7511F', fontSize: '13px', marginTop: '5px', fontWeight: 500 }}>
                  {errors.password}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.confirmPassword && (
                <div style={{ color: '#C7511F', fontSize: '13px', marginTop: '5px', fontWeight: 500 }}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-link">
            Already have an account?{' '}
            <Link to="/login">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;
