function Navbar({ currentSection, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'resource-management', label: 'Resource Management', icon: 'fa-sliders' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: 'fa-robot' },
    { id: 'historical-trends', label: 'Historical Trends', icon: 'fa-clock-rotate-left' },
    { id: 'credentials', label: 'AWS Credentials', icon: 'fa-key' }
  ];

  return (
    <div className="navbar">
      <div className="container">
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.id} className={`nav-item ${currentSection === item.id ? 'active' : ''}`}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                }}
              >
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
