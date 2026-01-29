function LoadingState() {
  return (
    <div id="loadingState" style={{ display: 'block' }}>
      <div className="loading-card">
        <div className="loading-spinner"></div>
        <h2>🔄 Analyzing Your AWS Infrastructure...</h2>
        <p>Fetching real-time data from CloudWatch, EC2, RDS, Lambda, and Cost Explorer</p>
        <div className="loading-progress">
          <div className="progress-bar" style={{ width: '75%', animation: 'progressAnimation 2s ease-in-out infinite' }}></div>
        </div>
        <p className="loading-status">Processing data...</p>
      </div>
    </div>
  );
}

export default LoadingState;
