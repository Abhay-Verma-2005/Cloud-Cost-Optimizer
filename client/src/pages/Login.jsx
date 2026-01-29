import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', isError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setModal({
        show: true,
        title: 'Validation Error',
        message: 'Please enter both username and password',
        isError: true
      });
      return;
    }

    setLoading(true);

    try {
      const data = await api.login(username, password);

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('username', data.username);
        setModal({
          show: true,
          title: 'Login Successful',
          message: `Welcome back, ${data.username}! Redirecting to dashboard...`,
          isError: false
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setModal({
          show: true,
          title: 'Login Failed',
          message: data.message || 'Invalid credentials',
          isError: true
        });
      }
    } catch (error) {
      console.error('Login request failed:', error);
      setModal({
        show: true,
        title: 'Connection Error',
        message: 'Could not connect to the server. Please ensure the backend is running.',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };

  return (
    <>
      <div className="header" style={{ padding: '8px 20px' }}>    
        <h1>
          <img src="/logo-a.png" alt="CostInsight Logo" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain', marginRight: '10px', verticalAlign: 'middle' }} />
          CostInsight
        </h1>
        <p style={{ fontSize: '0.9rem', padding: '0px 10px', fontWeight: 300 }}>
          Insight of your Real-Time AWS Analytics & AI-Powered Advisor
        </p>
      </div>

      <div className="container">
        <div className="card" style={{ maxWidth: '450px', margin: '50px auto', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--color-primary)', marginBottom: '10px' }}>
            Welcome Back
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666', fontSize: '0.95rem' }}>
            Sign in to analyze your AWS infrastructure
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input 
                type="text" 
                id="username" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input 
                type="password" 
                id="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                autoComplete="current-password"
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }} disabled={loading}>
              {loading ? 'Loading...' : <><i className="fa-solid fa-right-to-bracket"></i> Log In</>}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '0.95rem' }}>
            Don't have an account? 
            <Link to="/signup" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, marginLeft: '5px' }}>
              Create Account
            </Link>
          </div>

          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #ddd', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
            <p>
              <i className="fa-solid fa-lightbulb"></i> <strong>Features:</strong> Real-time AWS monitoring • Cloud cost advisor • AI cost Optimizer
            </p>
          </div>
        </div>
      </div>
      
      {modal.show && (
        <Modal 
          title={modal.title}
          message={modal.message}
          isError={modal.isError}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default Login;
