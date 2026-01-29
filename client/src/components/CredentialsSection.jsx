import { useState, useEffect, useRef } from 'react';

function CredentialsSection({ onAnalyze, onBack }) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    awsAccessKey: '',
    awsSecretKey: ''
  });
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load saved credentials on mount
  useEffect(() => {
    const savedCreds = localStorage.getItem('awsCredentials');
    if (savedCreds) {
      try {
        const { awsAccessKey, awsSecretKey } = JSON.parse(savedCreds);
        setCredentials({ awsAccessKey, awsSecretKey });
        console.log('✅ Loaded saved AWS credentials');
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAnalyze(credentials.awsAccessKey, credentials.awsSecretKey);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="section-card credentials-section" style={{ display: 'block' }}>
      <div className="section-header">
        <div>
          <h2><i className="fa-solid fa-key"></i> AWS Credentials Management</h2>
          <p>Update your AWS credentials to analyze infrastructure in real-time</p>
        </div>
        <button
          onClick={onBack}
          className="refresh-btn"
          style={{ padding: '10px 20px' }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="credentials-grid">
          <div className="form-group">
            <label htmlFor="awsAccessKey">
              AWS Access Key ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="awsAccessKey"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={credentials.awsAccessKey}
              onChange={(e) => setCredentials({ ...credentials, awsAccessKey: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="awsSecretKey">
              AWS Secret Access Key <span className="required">*</span>
            </label>
            <input
              type="password"
              id="awsSecretKey"
              placeholder="wJalrXUtnFEMI/..."
              value={credentials.awsSecretKey}
              onChange={(e) => setCredentials({ ...credentials, awsSecretKey: e.target.value })}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="info-banner">
          <strong>ℹ️ Required AWS Permissions:</strong> EC2:Describe*, CloudWatch:GetMetricStatistics,
          CostExplorer:GetCostAndUsage, RDS:Describe*, Lambda:List*
        </div>

        <button
          type="submit"
          className="analyze-button"
          disabled={loading}
          style={{
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Analyzing...
            </>
          ) : (
            <>
              <i className="fa-solid fa-magnifying-glass-chart"></i> Analyze AWS Infrastructure
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CredentialsSection;
