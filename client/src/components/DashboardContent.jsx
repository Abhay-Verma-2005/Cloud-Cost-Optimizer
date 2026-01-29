import { formatCurrency, formatDate } from '../utils/helpers';

function DashboardContent({ data, onNavigate }) {
  const { awsData, aiAdvice, history, isSimulated, validatedAccount } = data;

  return (
    <div id="dashboardContent" style={{ display: 'block' }}>
      {/* AWS Account Info Card */}
      <div className="section-card" style={{
        background: 'linear-gradient(135deg, #fefce8 0%, #eef2ff 100%)',
        borderLeft: '5px solid #4f46e5',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#3730a3', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
              <i className="fa-solid fa-cloud-arrow-up"></i> Connected AWS Account
            </h3>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#495057' }}>
              {validatedAccount ? `AWS Account: ${validatedAccount}` : 'Connected'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6c757d' }}>
              Last updated: {formatDate(awsData.timestamp)}
            </p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <i className="fa-brands fa-aws" style={{ fontSize: '3rem', color: '#ff9900' }}></i>
          </div>
        </div>
      </div>

      {/* Cost Overview Section */}
      <div className="section-card">
        <div className="section-header">
          <h2><i className="fa-solid fa-dollar-sign"></i> Cost Overview</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="refresh-indicator" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ color: isSimulated ? 'var(--color-warning)' : 'var(--color-success)' }}>
                ● {isSimulated ? 'Simulated Data' : 'Real-Time Data'}
              </span>
            </div>
          </div>
        </div>
        <div className="metrics-grid">
          <div className="metric-box primary">
            <div className="metric-label">Current Month Cost</div>
            <div className="metric-value">{formatCurrency(awsData.totalMonthlyCost)}</div>
            <div className="metric-change">--</div>
          </div>
          <div className="metric-box success">
            <div className="metric-label">Potential Savings</div>
            <div className="metric-value">{formatCurrency(awsData.savingsOpportunities)}</div>
            <div className="metric-change">Optimization opportunities</div>
          </div>
          <div className="metric-box warning">
            <div className="metric-label">Forecasted Cost</div>
            <div className="metric-value">{formatCurrency(awsData.forecastedCost || awsData.totalMonthlyCost)}</div>
            <div className="metric-change">End of month projection</div>
          </div>
          <div className="metric-box info">
            <div className="metric-label">Annual Savings</div>
            <div className="metric-value">{formatCurrency(awsData.savingsOpportunities * 12)}</div>
            <div className="metric-change">If optimizations applied</div>
          </div>
        </div>
      </div>

      {/* Infrastructure Overview */}
      <div className="section-card">
        <div className="section-header">
          <h2><i className="fa-solid fa-server"></i> Infrastructure Overview</h2>
        </div>
        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-label">Total EC2 Instances</div>
            <div className="metric-value">{awsData.totalInstances || 0}</div>
            <div className="metric-subtext">
              Running: {awsData.runningInstances || 0} | Stopped: {awsData.stoppedInstances || 0}
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">EBS Volumes</div>
            <div className="metric-value">{awsData.totalVolumes || 0}</div>
            <div className="metric-subtext">
              Storage: {awsData.totalStorageGB || 0} GB | Unattached: {awsData.unattachedVolumes || 0}
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Snapshots</div>
            <div className="metric-value">{awsData.totalSnapshots || 0}</div>
            <div className="metric-subtext">
              Old snapshots: {awsData.oldSnapshots?.length || 0}
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Lambda Functions</div>
            <div className="metric-value">{awsData.totalLambdaFunctions || 0}</div>
            <div className="metric-subtext">
              Underutilized: {awsData.underutilizedLambda?.length || 0}
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">RDS Instances</div>
            <div className="metric-value">{awsData.totalRDSInstances || 0}</div>
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="section-card">
        <div className="section-header">
          <h2><i className="fa-solid fa-bolt"></i> Quick Actions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button
            onClick={() => onNavigate('credentials')}
            className="refresh-btn"
            style={{ width: '100%' }}
          >
            <i className="fa-solid fa-rotate"></i> Refresh Analysis
          </button>
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="ask-button"
            style={{ width: '100%' }}
          >
            <i className="fa-solid fa-robot"></i> Ask AI Assistant
          </button>
          <button
            onClick={() => onNavigate('historical-trends')}
            className="refresh-btn"
            style={{ width: '100%' }}
          >
            <i className="fa-solid fa-chart-line"></i> View Trends
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;
