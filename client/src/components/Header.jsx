function Header({ username, onLogout, onOpenSettings }) {
  return (
    <div className="header">
      <div className="header-container">
        <div className="header-brand">
          <a href="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <h1 className="header-title">
              <img src="/logo-a.png" alt="CostInsight Logo" style={{ width: '2.4rem', height: '2.4rem', objectFit: 'contain', marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
              CostInsight
            </h1>
          </a>
          <p className="header-subtitle">
            Insight of your Real-Time AWS Analytics & AI-Powered Advisor
          </p>
        </div>
        <div className="header-actions">
          <div
            className="profile-section"
            onClick={onOpenSettings}
          >
            <div className="profile-icon-circle">
              <i className="fa-solid fa-user-circle"></i>
            </div>
            <div className="profile-info">
              <div className="profile-name">{username || 'Loading...'}</div>
              <div className="profile-label">View Profile</div>
            </div>
          </div>
          <button
            className="logout-button"
            onClick={onLogout}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;
