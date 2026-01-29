import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import CredentialsSection from '../components/CredentialsSection';
import DashboardSkeleton from '../components/DashboardSkeleton';
import DashboardContent from '../components/DashboardContent';
import AccountSettings from '../components/AccountSettings';
import AIAssistant from '../components/AIAssistant';
import HistoricalTrends from '../components/HistoricalTrends';
import ResourceManagement from '../components/ResourceManagement';

function Dashboard() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [username, setUsername] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Load any cached dashboard data
    const cachedData = localStorage.getItem('lastAnalysis');
    if (cachedData) {
      try {
        setDashboardData(JSON.parse(cachedData));
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    }

    // Fetch user profile
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found');
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.log('Token expired or invalid');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUserInfo(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('awsCredentials');
    localStorage.removeItem('lastAnalysis');
    navigate('/login');
  };

  const handleAnalyze = async (awsAccessKey, awsSecretKey, options = {}) => {
    const { hideLoader = false, skipAI = false, navigateOnSuccess = false } = options;

    if (!hideLoader) {
      setLoading(true);
    }

    try {
      // Save credentials to localStorage
      localStorage.setItem('awsCredentials', JSON.stringify({ awsAccessKey, awsSecretKey }));

      const data = await api.analyzeAWS(awsAccessKey, awsSecretKey, { skipAI });

      if (data.success) {
        setDashboardData(prevData => {
          // Keep old AI advice if new one is skipped
          if (skipAI && !data.aiAdvice && prevData?.aiAdvice) {
            return { ...data, aiAdvice: prevData.aiAdvice };
          }
          return data;
        });

        // Update lastAnalysis only if it's a full analysis (with AI) or if we don't have one yet
        if (!skipAI) {
          localStorage.setItem('lastAnalysis', JSON.stringify(data));
        }

        // Navigate if explicit requested OR if it's a full foreground load
        if (navigateOnSuccess || !hideLoader) {
          setCurrentSection('dashboard');
        }
      } else {
        if (!hideLoader) alert(data.message || 'Failed to analyze AWS infrastructure');
        console.error('Refresh failed:', data.message);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      if (!hideLoader) alert('Failed to connect to the server. Please ensure the backend is running.');
    } finally {
      if (!hideLoader) {
        setLoading(false);
      }
    }
  };

  // Handle refresh event from ResourceManagement
  useEffect(() => {
    const handleRefresh = async () => {
      console.log('🔄 Refresh event received');
      const savedCreds = localStorage.getItem('awsCredentials');
      if (savedCreds) {
        try {
          const { awsAccessKey, awsSecretKey } = JSON.parse(savedCreds);
          console.log('🔄 Re-analyzing (Background - No AI)...');
          // Auto-refresh: Hide loader AND Skip AI
          await handleAnalyze(awsAccessKey, awsSecretKey, { hideLoader: true, skipAI: true });
        } catch (error) {
          console.error('Error refreshing:', error);
        }
      }
    };

    window.addEventListener('refreshAWSData', handleRefresh);
    return () => window.removeEventListener('refreshAWSData', handleRefresh);
  }, []);

  const handleNavigation = async (section) => {
    setCurrentSection(section);

    // If switching TO dashboard, refresh AI data silently to ensure advice matches current instances
    if (section === 'dashboard') {
      const savedCreds = localStorage.getItem('awsCredentials');
      if (savedCreds) {
        try {
          const { awsAccessKey, awsSecretKey } = JSON.parse(savedCreds);
          console.log('🧠 Refreshing AI advice for Dashboard view...');
          // Tab Switch: Hide loader but FETCH AI
          await handleAnalyze(awsAccessKey, awsSecretKey, { hideLoader: true, skipAI: false });
        } catch (error) {
          console.error('Error refreshing AI:', error);
        }
      }
    }
  };

  const handleUpdateProfile = (updatedData) => {
    setUserInfo({ ...userInfo, ...updatedData });
  };

  return (
    <>
      <Header
        username={username}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <AccountSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userInfo={userInfo}
        onUpdate={handleUpdateProfile}
      />

      <Navbar currentSection={currentSection} onNavigate={handleNavigation} />

      <div className="container" style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px' }}>
        {currentSection === 'credentials' && (
          <CredentialsSection
            onAnalyze={(key, secret) => handleAnalyze(key, secret, { hideLoader: true, navigateOnSuccess: true })}
            onBack={() => setCurrentSection('dashboard')}
          />
        )}

        {loading && <DashboardSkeleton />}

        {!loading && currentSection === 'dashboard' && dashboardData && (
          <DashboardContent
            data={dashboardData}
            onNavigate={handleNavigation}
          />
        )}

        {!loading && currentSection === 'ai-assistant' && dashboardData && (
          <AIAssistant
            aiAdvice={dashboardData.aiAdvice}
          />
        )}

        {!loading && currentSection === 'ai-assistant' && !dashboardData && (
          <div className="section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="fa-solid fa-robot" style={{ fontSize: '3rem', color: '#667eea', marginBottom: '20px' }}></i>
            <h2 style={{ marginBottom: '15px' }}>AI Assistant</h2>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Please analyze your AWS infrastructure first to use the AI Assistant
            </p>
            <button
              onClick={() => setCurrentSection('credentials')}
              style={{
                padding: '14px 28px',
                background: 'var(--color-primary-gradient)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-key"></i> Configure AWS Credentials
            </button>
          </div>
        )}

        {!loading && currentSection === 'dashboard' && !dashboardData && (
          <div className="section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <img src="/logo-w.png" alt="CostInsight Logo" style={{ width: '4.2rem', height: '4.2rem', objectFit: 'contain', marginBottom: '20px', display: 'inline-block', verticalAlign: 'middle' }} />
            <h2 style={{ marginBottom: '15px' }}>Welcome to CostInsight</h2>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Start by configuring your AWS credentials to analyze your infrastructure
            </p>
            <button
              onClick={() => setCurrentSection('credentials')}
              style={{
                padding: '14px 28px',
                background: 'var(--color-primary-gradient)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-key"></i> Configure AWS Credentials
            </button>
          </div>
        )}

        {!loading && currentSection === 'historical-trends' && dashboardData && (
          <HistoricalTrends
            history={dashboardData.history || []}
          />
        )}

        {!loading && currentSection === 'historical-trends' && !dashboardData && (
          <div className="section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="fa-solid fa-chart-line" style={{ fontSize: '3rem', color: '#FF9900', marginBottom: '20px' }}></i>
            <h2 style={{ marginBottom: '15px' }}>Historical Trends</h2>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Please analyze your AWS infrastructure first to view historical trends
            </p>
            <button
              onClick={() => setCurrentSection('credentials')}
              style={{
                padding: '14px 28px',
                background: 'var(--color-primary-gradient)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-key"></i> Configure AWS Credentials
            </button>
          </div>
        )}

        {!loading && currentSection === 'resource-management' && dashboardData && (
          <ResourceManagement
            awsData={dashboardData.awsData}
            awsCredentials={{ /* pass if needed */ }}
          />
        )}

        {!loading && currentSection === 'resource-management' && !dashboardData && (
          <div className="section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="fa-solid fa-sliders" style={{ fontSize: '3rem', color: '#FF9900', marginBottom: '20px' }}></i>
            <h2 style={{ marginBottom: '15px' }}>Resource Management</h2>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Please analyze your AWS infrastructure first to manage resources
            </p>
            <button
              onClick={() => setCurrentSection('credentials')}
              style={{
                padding: '14px 28px',
                background: 'var(--color-primary-gradient)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-key"></i> Configure AWS Credentials
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
